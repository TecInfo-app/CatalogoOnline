import { Product, Client, Order, StoreProfile, Coupon } from '../types';
import { products as initialProducts, clients as initialClients, orders as initialOrders } from '../data';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const getStorageKey = (email: string, key: string) => `vercos_${email}_${key}`;

export const getStoreProfile = (email: string): StoreProfile => {
  const data = localStorage.getItem(getStorageKey(email, 'store_profile'));
  if (data) return JSON.parse(data);
  const defaultProfile: StoreProfile = {
    name: 'iranildo',
    phone: '(81) 99971-2618',
    email: email || 'iranildo.jobs@gmail.com',
    bio: '',
    shopName: 'Vercos',
    shopNumber: '1',
    logoUrl: ''
  };
  localStorage.setItem(getStorageKey(email, 'store_profile'), JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const saveStoreProfile = (email: string, profile: StoreProfile): void => {
  localStorage.setItem(getStorageKey(email, 'store_profile'), JSON.stringify(profile));
};


export const getProducts = (email: string): Product[] => {
  const data = localStorage.getItem(getStorageKey(email, 'products'));
  if (data) return JSON.parse(data);
  // Initialize with some default catalog for everyone
  localStorage.setItem(getStorageKey(email, 'products'), JSON.stringify(initialProducts));
  return initialProducts;
};

export const saveProducts = (email: string, products: Product[]): void => {
  localStorage.setItem(getStorageKey(email, 'products'), JSON.stringify(products));
};

export const getCoupons = (email: string): Coupon[] => {
  const data = localStorage.getItem(getStorageKey(email, 'coupons'));
  if (data) return JSON.parse(data);
  
  // Seed initial promotions
  const initialCoupons: Coupon[] = [
    {
      id: 'cp-1',
      code: 'VERCOS10',
      name: 'Cupom de Boas-vindas',
      type: 'cupom',
      discountType: 'percentage',
      discountValue: 10,
      isActive: true
    },
    {
      id: 'cp-2',
      code: 'NIVER15',
      name: 'Desconto de Aniversário',
      type: 'aniversario',
      discountType: 'percentage',
      discountValue: 15,
      isActive: true
    },
    {
      id: 'cp-3',
      code: 'COMPRAGRANDE',
      name: 'Super Compra Acima de R$300',
      type: 'valor_pedido',
      discountType: 'fixed',
      discountValue: 30,
      minOrderValue: 300,
      isActive: true
    },
    {
      id: 'cp-4',
      code: 'FIDELIDADE50',
      name: 'Programa de Fidelidade',
      type: 'fidelidade',
      discountType: 'fixed',
      discountValue: 50,
      isActive: false
    }
  ];
  
  localStorage.setItem(getStorageKey(email, 'coupons'), JSON.stringify(initialCoupons));
  return initialCoupons;
};

export const saveCoupons = (email: string, coupons: Coupon[]): void => {
  localStorage.setItem(getStorageKey(email, 'coupons'), JSON.stringify(coupons));
};

export const getClients = (email: string): Client[] => {
  const data = localStorage.getItem(getStorageKey(email, 'clients'));
  if (data) return JSON.parse(data);
  // Start with empty clients for new users, but give the default ones to 'ciadochopp.contato@gmail.com' or just start empty
  const defaultData = email.includes('demo') || email === 'ciadochopp.contato@gmail.com' ? initialClients : [];
  localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(defaultData));
  return defaultData;
};

export const getOrders = (email: string): Order[] => {
  const data = localStorage.getItem(getStorageKey(email, 'orders'));
  if (data) return JSON.parse(data);
  const defaultData = email.includes('demo') || email === 'ciadochopp.contato@gmail.com' ? initialOrders : [];
  localStorage.setItem(getStorageKey(email, 'orders'), JSON.stringify(defaultData));
  return defaultData;
};

// Helper to remove undefined values recursively for Firestore compatibility
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Functions to add new items
export const addClient = (email: string, client: Client) => {
  const clients = getClients(email);
  clients.push(client);
  localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(clients));

  try {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === email.toLowerCase());
    if (!isOwner && email) {
      const docRef = doc(db, 'users', email, 'incoming_clients', client.id);
      setDoc(docRef, cleanUndefined(client)).catch(err => {
        console.error("Firestore write client error:", err);
      });
    }
  } catch (err) {
    console.error("Failed to sync new client to incoming_clients", err);
  }
};

export const updateClient = (email: string, client: Client) => {
  const clients = getClients(email);
  const index = clients.findIndex(c => c.id === client.id);
  if (index !== -1) {
    clients[index] = client;
    localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(clients));
  }

  try {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === email.toLowerCase());
    if (!isOwner && email) {
      const docRef = doc(db, 'users', email, 'incoming_clients', client.id);
      setDoc(docRef, cleanUndefined(client)).catch(err => {
        console.error("Firestore update client error:", err);
      });
    }
  } catch (err) {
    console.error("Failed to sync updated client to incoming_clients", err);
  }
};

export const deleteClient = (email: string, id: string) => {
  let clients = getClients(email);
  clients = clients.filter(c => c.id !== id);
  localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(clients));
};

export const addOrder = (email: string, order: Order) => {
  const orders = getOrders(email);
  orders.push(order);
  localStorage.setItem(getStorageKey(email, 'orders'), JSON.stringify(orders));

  try {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.email && (currentUser.email.toLowerCase() === email.toLowerCase());
    if (!isOwner && email) {
      const docRef = doc(db, 'users', email, 'incoming_orders', order.id);
      setDoc(docRef, cleanUndefined(order)).catch(err => {
        console.error("Firestore write order error:", err);
      });
    }
  } catch (err) {
    console.error("Failed to sync new order to incoming_orders", err);
  }
};

export const updateOrder = (email: string, order: Order) => {
  const orders = getOrders(email);
  const index = orders.findIndex(o => o.id === order.id);
  if (index !== -1) {
    orders[index] = order;
    localStorage.setItem(getStorageKey(email, 'orders'), JSON.stringify(orders));
  }
};

export const deleteOrder = (email: string, id: string) => {
  let orders = getOrders(email);
  orders = orders.filter(o => o.id !== id);
  localStorage.setItem(getStorageKey(email, 'orders'), JSON.stringify(orders));
};

export interface IndicatorSettings {
  carteiraRecenteDias: number;
  carteiraAntigoDias: number;
  positivacaoRecenteDias: number;
  positivacaoAntigoDias: number;
}

export const getIndicatorSettings = (email: string): IndicatorSettings => {
  const data = localStorage.getItem(getStorageKey(email, 'indicator_settings'));
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }
  const defaultSettings: IndicatorSettings = {
    carteiraRecenteDias: 180,
    carteiraAntigoDias: 365,
    positivacaoRecenteDias: 180,
    positivacaoAntigoDias: 365,
  };
  localStorage.setItem(getStorageKey(email, 'indicator_settings'), JSON.stringify(defaultSettings));
  return defaultSettings;
};

export const saveIndicatorSettings = (email: string, settings: IndicatorSettings): void => {
  localStorage.setItem(getStorageKey(email, 'indicator_settings'), JSON.stringify(settings));
  window.dispatchEvent(new Event('vercos_data_synced'));
};

