export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface SystemUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Cajero' | 'Vendedor' | 'Supervisor';
  status: 'Activo' | 'Suspendido';
  lastLogin?: string;
}

export interface Backup {
  id: string;
  companyId: string;
  name: string;
  size: string;
  createdAt: string;
}

export interface CRMDeal {
  id: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  title: string;
  value: number;
  stage: 'Nuevo' | 'Contactado' | 'En Negociación' | 'Ganado' | 'Perdido';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  companyId: string;
  customerId: string;
  amount: number;
  remainingAmount: number;
  reason: string;
  dueDate?: string;
  status: 'Pendiente' | 'Pagado' | 'Vencido';
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  method: string;
}

export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  type: 'Entrada' | 'Salida';
  qty: number;
  reason: string;
  date: string;
}

export interface Expense {
  id: string;
  companyId: string;
  concept: string;
  amount: number;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
}

export interface Ingredient {
  id: string;
  companyId: string;
  name: string;
  unit: string;
  stock: number;
  minStock?: number;
  cost: number;
}

export interface RecipeItem {
  ingredientId: string;
  qty: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  variants?: Record<string, string>;
}

export interface Order {
  id: string;
  companyId: string;
  customerName: string;
  customerPhone?: string;
  deliveryMethod: 'delivery' | 'pickup';
  address?: string;
  reference?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  couponCode?: string;
  status: 'Pendiente' | 'Pagado' | 'Enviado' | 'Entregado';
  type?: 'online' | 'pos';
  paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'mixto' | 'credito' | 'vale';
  amountPaid?: number;
  sellerName?: string;
  notes?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  businessType?: string;
  color: string;
  whatsapp: string;
  logo: string;
  banner?: string;
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  hours?: string;
  socialLinks?: { platform: string; url: string }[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  yapeNumber?: string;
  yapeQr?: string;
  plinNumber?: string;
  plinQr?: string;
  bankName?: string;
  bankAccount?: string;
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
  metaPixelId?: string;
  currency?: string;
  categories?: Category[];
  coupons?: Coupon[];
  storeHoursType?: '24h' | 'specific';
  storeSchedule?: Record<number, { isOpen: boolean; openTime: string; closeTime: string }>;
  subscriptionStatus?: 'Activa' | 'Suspendida' | 'Pendiente' | 'Vencida';
  subscriptionEndsAt?: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  desc: string;
  sku?: string;
  barcode?: string;
  price: number;
  salePrice?: number;
  category: string;
  image: string;
  stock?: number | null;
  minStock?: number;
  variants?: { name: string; options: string[] }[];
  recipe?: RecipeItem[];
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string;
  items: {
    productId?: string;
    ingredientId?: string;
    name: string;
    qty: number;
    price: number;
  }[];
  total: number;
  status: 'Borrador' | 'Enviada' | 'Recibida' | 'Cancelada';
  expectedDate?: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  companyId: string;
  productId?: string;
  ingredientId?: string;
  batchNumber: string;
  qty: number;
  expirationDate: string;
  createdAt: string;
}
