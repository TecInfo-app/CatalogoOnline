export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl: string;
  isPromo?: boolean;
  isActive?: boolean;
  unit?: string;
  multiple?: number;
  category?: string;
  minPrice?: number;
  ipi?: string;
  comissao?: string;
  description?: string;
  weight?: string;
  dimensions?: string;
  variations?: Array<{ name: string; values: string[] }>;
}

export interface Client {
  id: string;
  type?: 'Pessoa Jurídica' | 'Pessoa Física';
  name: string; // usually trade name or short name
  legalName: string; // corporate name / razao social
  cnpj: string; // cnpj or cpf
  status: 'active' | 'prospect' | 'inactive';
  location: string;
  lastContact: string;
  ltv?: number;
  hasAlert?: boolean;
  alertMessage?: string;
  phones?: string[];
  emails?: string[];
  isPortalEnabled?: boolean;
  birthday?: string; // Client's birthday in YYYY-MM-DD format
  address?: {
    cep?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contacts?: Array<{
    name: string;
    role: string;
    phones: string[];
    emails: string[];
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientId?: string;
  date: string;
  itemsCount: number;
  total: number;
  status: 'budget' | 'completed' | 'canceled';
  paymentMethod?: string;
  orderType?: string;
  items?: Array<{ productId: string; name: string; quantity: number; price: number }>;
  subtotal?: number;
  discount?: number;
  discountNotes?: string;
  dueDate?: string;
  installments?: number;
  asaasPaymentId?: string;
  asaasUrl?: string;
  asaasStatus?: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'SIMULATED';
}

export interface PlannedRoute {
  id: string;
  name: string;
  salesperson: string;
  date: string; // YYYY-MM-DD
  repeat: string; // 'Nunca' | 'Semanalmente' | ...
  active: boolean;
  clients: string[]; // client IDs
}

export interface StoreProfile {
  name: string;
  phone: string;
  email: string;
  bio: string;
  shopName: string;
  shopNumber: string;
  logoUrl?: string;
  slug?: string;
  abacatePayEnabled?: boolean;
  abacatePayApiKey?: string;
  abacatePayWorkerUrl?: string;
  asaasEnabled?: boolean;
  asaasApiKey?: string;
  asaasEnvironment?: 'sandbox' | 'production';
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'fidelidade' | 'aniversario' | 'valor_pedido' | 'cupom';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  isActive: boolean;
  isFirstOrderOnly?: boolean;
  minOrdersRequired?: number;
  expiryDate?: string;
}


