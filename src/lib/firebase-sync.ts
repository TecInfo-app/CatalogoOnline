import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Order, Client, Product } from '../types';

const KNOWN_KEYS = ['store_profile', 'products', 'coupons', 'clients', 'orders', 'product_categories', 'agenda_items', 'planned_routes'];

// Call this on app load or when user logs in
// It will pull all keys from Firestore into localStorage
export const loadStoreData = async (email: string) => {
  // First, load standard keys
  for (const key of KNOWN_KEYS) {
    try {
      const docRef = doc(db, 'users', email, 'data', key);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data().value;
        if (data !== undefined) {
          localStorage.setItem(`vercos_${email}_${key}`, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error(`Error loading ${key}`, e);
    }
  }

  // Next, if current logged in user is the owner, pull and merge incoming orders/clients queue
  try {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === email.toLowerCase());

    if (isOwner) {
      // 1. Process incoming_orders queue
      try {
        const ordersCol = collection(db, 'users', email, 'incoming_orders');
        const ordersSnap = await getDocs(ordersCol);
        if (!ordersSnap.empty) {
          const storedOrdersKey = `vercos_${email}_orders`;
          let currentOrders: Order[] = [];
          const localData = localStorage.getItem(storedOrdersKey);
          if (localData) {
            currentOrders = JSON.parse(localData);
          }

          // Also get products to update stocks
          const storedProductsKey = `vercos_${email}_products`;
          let currentProducts: Product[] = [];
          const prodData = localStorage.getItem(storedProductsKey);
          if (prodData) {
            currentProducts = JSON.parse(prodData);
          }
          let updatedAnyProduct = false;

          for (const orderDoc of ordersSnap.docs) {
            const orderData = orderDoc.data() as Order;
            // Avoid duplicates
            if (!currentOrders.some(o => o.id === orderData.id || o.orderNumber === orderData.orderNumber)) {
              currentOrders.unshift(orderData);

              // Deduct product stock
              if (orderData.items && Array.isArray(orderData.items)) {
                orderData.items.forEach(orderItem => {
                  const prodIndex = currentProducts.findIndex(p => p.id === orderItem.productId);
                  if (prodIndex !== -1) {
                    const prod = currentProducts[prodIndex];
                    const newStock = Math.max(0, (prod.stock || 0) - orderItem.quantity);
                    prod.stock = newStock;
                    
                    if (newStock <= 0) {
                      prod.status = 'out_of_stock';
                    } else if (newStock <= 5) {
                      prod.status = 'low_stock';
                    } else {
                      prod.status = 'in_stock';
                    }
                    currentProducts[prodIndex] = prod;
                    updatedAnyProduct = true;
                  }
                });
              }
            }
            await deleteDoc(orderDoc.ref);
          }

          // Save merged orders
          localStorage.setItem(storedOrdersKey, JSON.stringify(currentOrders));

          // Save updated products if stock changed
          if (updatedAnyProduct && currentProducts.length > 0) {
            localStorage.setItem(storedProductsKey, JSON.stringify(currentProducts));
          }
        }
      } catch (err) {
        console.error("Error processing incoming orders queue:", err);
      }

      // 2. Process incoming_clients queue
      try {
        const clientsCol = collection(db, 'users', email, 'incoming_clients');
        const clientsSnap = await getDocs(clientsCol);
        if (!clientsSnap.empty) {
          const storedClientsKey = `vercos_${email}_clients`;
          let currentClients: Client[] = [];
          const localData = localStorage.getItem(storedClientsKey);
          if (localData) {
            currentClients = JSON.parse(localData);
          }

          for (const clientDoc of clientsSnap.docs) {
            const clientData = clientDoc.data() as Client;
            const index = currentClients.findIndex(c => c.id === clientData.id);
            if (index === -1) {
              currentClients.push(clientData);
            } else {
              currentClients[index] = { ...currentClients[index], ...clientData };
            }
            await deleteDoc(clientDoc.ref);
          }

          localStorage.setItem(storedClientsKey, JSON.stringify(currentClients));
        }
      } catch (err) {
        console.error("Error processing incoming clients queue:", err);
      }
    }
  } catch (err) {
    console.error("Error in queue sync verification:", err);
  }
};

export const startRealTimeSync = (email: string, onSync: () => void) => {
  // Listen to incoming_orders
  const ordersCol = collection(db, 'users', email, 'incoming_orders');
  const unsubscribeOrders = onSnapshot(ordersCol, async (snapshot) => {
    if (snapshot.empty) return;

    const storedOrdersKey = `vercos_${email}_orders`;
    let currentOrders: Order[] = [];
    const localData = localStorage.getItem(storedOrdersKey);
    if (localData) {
      try {
        currentOrders = JSON.parse(localData);
      } catch (e) {
        console.error("Error parsing local orders during real-time sync", e);
      }
    }

    const storedProductsKey = `vercos_${email}_products`;
    let currentProducts: Product[] = [];
    const prodData = localStorage.getItem(storedProductsKey);
    if (prodData) {
      try {
        currentProducts = JSON.parse(prodData);
      } catch (e) {
        console.error("Error parsing local products during real-time sync", e);
      }
    }
    let updatedAnyProduct = false;
    let anyMerged = false;

    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const orderData = change.doc.data() as Order;
        // Avoid duplicates
        if (!currentOrders.some(o => o.id === orderData.id || o.orderNumber === orderData.orderNumber)) {
          currentOrders.unshift(orderData);
          anyMerged = true;

          // Deduct product stock
          if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach(orderItem => {
              const prodIndex = currentProducts.findIndex(p => p.id === orderItem.productId);
              if (prodIndex !== -1) {
                const prod = currentProducts[prodIndex];
                const newStock = Math.max(0, (prod.stock || 0) - orderItem.quantity);
                prod.stock = newStock;
                
                if (newStock <= 0) {
                  prod.status = 'out_of_stock';
                } else if (newStock <= 5) {
                  prod.status = 'low_stock';
                } else {
                  prod.status = 'in_stock';
                }
                currentProducts[prodIndex] = prod;
                updatedAnyProduct = true;
              }
            });
          }
        }
        // Delete from firestore queue since we consumed it locally
        try {
          await deleteDoc(change.doc.ref);
        } catch (err) {
          console.error("Failed to delete processed incoming order doc:", err);
        }
      }
    }

    if (anyMerged) {
      localStorage.setItem(storedOrdersKey, JSON.stringify(currentOrders));
      if (updatedAnyProduct && currentProducts.length > 0) {
        localStorage.setItem(storedProductsKey, JSON.stringify(currentProducts));
      }
      onSync();
    }
  }, (err) => {
    console.error("Error in real-time orders sync snapshot:", err);
  });

  // Listen to incoming_clients
  const clientsCol = collection(db, 'users', email, 'incoming_clients');
  const unsubscribeClients = onSnapshot(clientsCol, async (snapshot) => {
    if (snapshot.empty) return;

    const storedClientsKey = `vercos_${email}_clients`;
    let currentClients: Client[] = [];
    const localData = localStorage.getItem(storedClientsKey);
    if (localData) {
      try {
        currentClients = JSON.parse(localData);
      } catch (e) {
        console.error("Error parsing local clients during real-time sync", e);
      }
    }
    let anyMerged = false;

    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const clientData = change.doc.data() as Client;
        const index = currentClients.findIndex(c => c.id === clientData.id);
        if (index === -1) {
          currentClients.push(clientData);
          anyMerged = true;
        } else {
          currentClients[index] = { ...currentClients[index], ...clientData };
          anyMerged = true;
        }
        try {
          await deleteDoc(change.doc.ref);
        } catch (err) {
          console.error("Failed to delete processed incoming client doc:", err);
        }
      }
    }

    if (anyMerged) {
      localStorage.setItem(storedClientsKey, JSON.stringify(currentClients));
      onSync();
    }
  }, (err) => {
    console.error("Error in real-time clients sync snapshot:", err);
  });

  return () => {
    unsubscribeOrders();
    unsubscribeClients();
  };
};

let isPatched = false;

export const patchLocalStorage = () => {
  if (isPatched) return;
  isPatched = true;

  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    if (key.startsWith('vercos_')) {
      for (const knownKey of KNOWN_KEYS) {
        if (key.endsWith(`_${knownKey}`)) {
          // Extract email which is in the middle: vercos_{email}_{knownKey}
          const email = key.substring('vercos_'.length, key.length - `_${knownKey}`.length);
          
          try {
            const parsed = JSON.parse(value);
            const docRef = doc(db, 'users', email, 'data', knownKey);
            setDoc(docRef, { value: parsed }).catch(e => console.error("Firebase sync error", e));
          } catch (e) {
            // Not valid JSON or something else
          }
          break; // Found the matching key, no need to check others
        }
      }
    }
  };
};

patchLocalStorage();
