const API_URL = import.meta.env.VITE_API_URL || '';

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'entree' | 'plat' | 'dessert';
  tags: string[];
  variants: string[];
  active: boolean;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_notes: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  promo_code: string | null;
  status: string;
  created_at: string;
}

export interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

// Auth helpers
function getToken(): string | null {
  return localStorage.getItem('bledcrate_admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('bledcrate_admin_token', token);
}

export function logout() {
  localStorage.removeItem('bledcrate_admin_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Base request
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function login(email: string, password: string): Promise<string> {
  const { token } = await api<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(token);
  return token;
}

// Products
export const fetchProducts = () => api<Product[]>('/api/products');
export const createProduct = (p: Omit<Product, 'id'>) =>
  api<Product>('/api/products', { method: 'POST', body: JSON.stringify(p) });
export const updateProduct = (id: string, p: Partial<Product>) =>
  api<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(p) });
export const deleteProduct = (id: string) =>
  api<void>(`/api/products/${id}`, { method: 'DELETE' });

// Orders
export const fetchOrders = () => api<Order[]>('/api/orders');
export const updateOrderStatus = (id: string, status: string) =>
  api<Order>(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Promo Codes
export const fetchPromoCodes = () => api<PromoCode[]>('/api/promo-codes');
export const createPromoCode = (c: { code: string; discount_percent: number; max_uses: number | null; active: boolean; expires_at: string | null }) =>
  api<PromoCode>('/api/promo-codes', { method: 'POST', body: JSON.stringify(c) });
export const updatePromoCode = (id: string, c: Partial<PromoCode>) =>
  api<PromoCode>(`/api/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(c) });
export const deletePromoCode = (id: string) =>
  api<void>(`/api/promo-codes/${id}`, { method: 'DELETE' });

// Public - Checkout
export const createCheckout = (data: {
  items: OrderItem[];
  customer: { name: string; email: string; phone: string; address: string; notes: string };
  promo_code?: string;
}) => api<{ url: string }>('/api/checkout', { method: 'POST', body: JSON.stringify(data) });

export const validatePromo = (code: string) =>
  api<{ valid: boolean; discount_percent: number }>('/api/promo-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
