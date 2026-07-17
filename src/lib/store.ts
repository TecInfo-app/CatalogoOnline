import { Product, Client, Order, StoreProfile, Coupon } from '../types';
import { products as initialProducts, clients as initialClients, orders as initialOrders } from '../data';

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

// Functions to add new items
export const addClient = (email: string, client: Client) => {
  const clients = getClients(email);
  clients.push(client);
  localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(clients));
};

export const updateClient = (email: string, client: Client) => {
  const clients = getClients(email);
  const index = clients.findIndex(c => c.id === client.id);
  if (index !== -1) {
    clients[index] = client;
    localStorage.setItem(getStorageKey(email, 'clients'), JSON.stringify(clients));
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
