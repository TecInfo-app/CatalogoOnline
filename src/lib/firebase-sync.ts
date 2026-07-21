import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Order, Client, Product } from '../types';

const KNOWN_KEYS = ['store_profile', 'products', 'coupons', 'clients', 'orders', 'product_categories', 'agenda_items', 'planned_routes'];

let isSyncingFromFirebase = false;

/**
 * Validates and normalizes the merchant email / store ID.
 * Returns the sanitized, trimmed, lowercase email string, or null if invalid.
 */
export const getNormalizedEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  if (clean === '' || clean === 'null' || clean === 'undefined') return null;
  
  // Standard basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return null;
  }
  return clean;
};

// Call this on app load or when user logs in
// It will pull all keys from Firestore into localStorage
export const loadStoreData = async (email: string, onlyPublic: boolean = false) => {
  const normEmail = getNormalizedEmail(email);
  if (!normEmail) {
    console.error("loadStoreData was aborted due to an invalid or unauthenticated store owner email:", email);
    return;
  }

  isSyncingFromFirebase = true;
  try {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === normEmail);
    
    // Strict scoping: allow loading clients and orders for catalog login/history if onlyPublic is false,
    // but always keep agenda and routes restricted to the owner below.
    const actualOnlyPublic = onlyPublic;

    // First, load standard keys
    for (const key of KNOWN_KEYS) {
      // If only public data is requested, skip private tables
      const isPrivateKey = !['store_profile', 'products', 'coupons', 'product_categories'].includes(key);
      if (actualOnlyPublic && isPrivateKey) {
        continue;
      }

      // Also skip keys that a visitor should never fetch (agenda and routes)
      if (!isOwner && ['agenda_items', 'planned_routes'].includes(key)) {
        continue;
      }

      try {
        const docRef = doc(db, 'users', normEmail, 'data', key);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data().value;
          if (data !== undefined) {
            localStorage.setItem(`vitrine_pay_${normEmail}_${key}`, JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error(`Error loading key "${key}" for store "${normEmail}":`, e);
      }
    }
  } finally {
    isSyncingFromFirebase = false;
  }

  // If we only requested public data (or were restricted to it), skip the queue merging
  const currentUser = auth.currentUser;
  const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === normEmail);
  if (!isOwner || onlyPublic) return;

  // Next, if current logged in user is the owner, pull and merge incoming orders/clients queue
  try {
    if (isOwner) {
      // 1. Process incoming_orders queue
      try {
        const ordersCol = collection(db, 'users', normEmail, 'incoming_orders');
        const ordersSnap = await getDocs(ordersCol);
        if (!ordersSnap.empty) {
          const storedOrdersKey = `vitrine_pay_${normEmail}_orders`;
          let currentOrders: Order[] = [];
          const localData = localStorage.getItem(storedOrdersKey);
          if (localData) {
            currentOrders = JSON.parse(localData);
          }

          // Also get products to update stocks
          const storedProductsKey = `vitrine_pay_${normEmail}_products`;
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
        console.error(`Error processing incoming orders queue for ${normEmail}:`, err);
      }

      // 2. Process incoming_clients queue
      try {
        const clientsCol = collection(db, 'users', normEmail, 'incoming_clients');
        const clientsSnap = await getDocs(clientsCol);
        if (!clientsSnap.empty) {
          const storedClientsKey = `vitrine_pay_${normEmail}_clients`;
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
        console.error(`Error processing incoming clients queue for ${normEmail}:`, err);
      }
    }
  } catch (err) {
    console.error(`Error in queue sync verification for ${normEmail}:`, err);
  }
};

export const startRealTimeSync = (email: string, onSync: () => void) => {
  const normEmail = getNormalizedEmail(email);
  if (!normEmail) {
    console.error("startRealTimeSync aborted: invalid email/storeId:", email);
    return () => {};
  }

  // Listen to incoming_orders (strictly filtered and routed by normalized owner email)
  const ordersCol = collection(db, 'users', normEmail, 'incoming_orders');
  const unsubscribeOrders = onSnapshot(ordersCol, async (snapshot) => {
    if (snapshot.empty) return;

    const storedOrdersKey = `vitrine_pay_${normEmail}_orders`;
    let currentOrders: Order[] = [];
    const localData = localStorage.getItem(storedOrdersKey);
    if (localData) {
      try {
        currentOrders = JSON.parse(localData);
      } catch (e) {
        console.error(`Error parsing local orders for ${normEmail} during real-time sync`, e);
      }
    }

    const storedProductsKey = `vitrine_pay_${normEmail}_products`;
    let currentProducts: Product[] = [];
    const prodData = localStorage.getItem(storedProductsKey);
    if (prodData) {
      try {
        currentProducts = JSON.parse(prodData);
      } catch (e) {
        console.error(`Error parsing local products for ${normEmail} during real-time sync`, e);
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
          console.error(`Failed to delete processed incoming order doc for ${normEmail}:`, err);
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
    console.error(`Error in real-time orders sync snapshot for ${normEmail}:`, err);
  });

  // Listen to incoming_clients (strictly filtered and routed by normalized owner email)
  const clientsCol = collection(db, 'users', normEmail, 'incoming_clients');
  const unsubscribeClients = onSnapshot(clientsCol, async (snapshot) => {
    if (snapshot.empty) return;

    const storedClientsKey = `vitrine_pay_${normEmail}_clients`;
    let currentClients: Client[] = [];
    const localData = localStorage.getItem(storedClientsKey);
    if (localData) {
      try {
        currentClients = JSON.parse(localData);
      } catch (e) {
        console.error(`Error parsing local clients for ${normEmail} during real-time sync`, e);
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
          console.error(`Failed to delete processed incoming client doc for ${normEmail}:`, err);
        }
      }
    }

    if (anyMerged) {
      localStorage.setItem(storedClientsKey, JSON.stringify(currentClients));
      onSync();
    }
  }, (err) => {
    console.error(`Error in real-time clients sync snapshot for ${normEmail}:`, err);
  });

  return () => {
    unsubscribeOrders();
    unsubscribeClients();
  };
};

export const getEmailBySlug = async (slug: string): Promise<string | null> => {
  try {
    const slugKey = slug.toLowerCase().trim();
    if (!slugKey) return null;
    const docRef = doc(db, 'slugs', slugKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return getNormalizedEmail(snap.data().email);
    }
  } catch (e) {
    console.error("Error looking up slug:", e);
  }
  return null;
};

let isPatched = false;

export const patchLocalStorage = () => {
  if (isPatched) return;
  isPatched = true;

  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    if (isSyncingFromFirebase) return;

    if (key.startsWith('vitrine_pay_')) {
      for (const knownKey of KNOWN_KEYS) {
        if (key.endsWith(`_${knownKey}`)) {
          // Extract email which is in the middle: vitrine_pay_{email}_{knownKey}
          const rawEmail = key.substring('vitrine_pay_'.length, key.length - `_${knownKey}`.length);
          const email = getNormalizedEmail(rawEmail);
          if (!email) {
            break;
          }
          
          const currentUser = auth.currentUser;
          const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === email);
          if (!isOwner) {
            break; // Skip sync for visitors or non-owners to prevent cross-merchant leakage
          }

          try {
            const parsed = JSON.parse(value);
            const docRef = doc(db, 'users', email, 'data', knownKey);
            setDoc(docRef, { value: parsed }).catch(e => console.error(`Firebase sync error for ${email}:`, e));

            // Sync slug if this is store_profile
            if (knownKey === 'store_profile' && parsed && typeof parsed === 'object') {
              const slug = (parsed as any).slug;
              if (slug && typeof slug === 'string') {
                const slugKey = slug.toLowerCase().trim();
                if (slugKey) {
                  const slugDocRef = doc(db, 'slugs', slugKey);
                  setDoc(slugDocRef, { email: email }).catch(e => console.error(`Firebase slug sync error for ${email}:`, e));
                }
              }
            }
          } catch (e) {
            // Not valid JSON or other parsing exception
          }
          break; // Found the matching key, no need to check others
        }
      }
    }
  };
};

patchLocalStorage();
