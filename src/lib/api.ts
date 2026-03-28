const API_URL = import.meta.env.VITE_API_URL || '/0x';

// Types
export interface ProductVariant {
  name: string;
  price: number; // adjustment from base price (+/- $)
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'entree' | 'plat' | 'dessert';
  tags: string[];
  variants: ProductVariant[];
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
  tracking_code?: string;
  tracking_step?: number;
  tracking_note?: string;
}

export interface OrderTracking {
  tracking_code: string;
  tracking_step: number;
  tracking_note: string;
  status: string;
  customer_name: string;
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

export interface SiteSettings {
  bundle_enabled: string;
  bundle_min_items: string;
  bundle_discount_percent: string;
  delivery_fee: string;
  free_delivery_threshold: string;
  delivery_banner_enabled: string;
  subscription_enabled: string;
  subscription_free_delivery: string;
  box_onetime_enabled: string;
  box_subscription_enabled: string;
  box_min_entrees: string;
  box_max_entrees: string;
  box_min_plats: string;
  box_max_plats: string;
  box_min_desserts: string;
  box_max_desserts: string;
  box_sub_meal_counts: string;
}

export interface SubscriptionPlan {
  id: string;
  plan_type: 'moi' | 'bundle';
  name: string;
  meals_per_week: number;
  price_per_meal: number;
  monthly_price: number;
  discount_percent: number;
  is_popular: boolean;
  stripe_price_id: string | null;
  active: boolean;
  sort_order: number;
  billing_interval: 'week' | 'month' | 'weekly' | 'monthly';
  created_at: string;
}

export interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  // Joined from plan
  plan_name?: string;
  plan_type?: string;
  meals_per_week?: number;
  monthly_price?: number;
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

// Settings
export const fetchPublicSettings = () => api<SiteSettings>('/api/settings');
export const fetchAdminSettings = () => api<SiteSettings>('/api/settings/admin');
export const updateSettings = (s: Partial<SiteSettings>) =>
  api<SiteSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(s) });

// Public - Checkout
export const createCheckout = (data: {
  items: OrderItem[];
  customer: { name: string; email: string; phone: string; address: string; notes: string };
  promo_code?: string;
  bundle_discount?: boolean;
  delivery_fee?: number;
}) => api<{ url: string }>('/api/checkout', { method: 'POST', body: JSON.stringify(data) });

export const validatePromo = (code: string) =>
  api<{ valid: boolean; discount_percent: number }>('/api/promo-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

// Subscription Plans
export const fetchSubscriptionPlans = () => api<SubscriptionPlan[]>('/api/subscription-plans');
export const fetchAdminSubscriptionPlans = () => api<SubscriptionPlan[]>('/api/subscription-plans/admin');
export const createSubscriptionPlan = (p: Partial<SubscriptionPlan>) =>
  api<SubscriptionPlan>('/api/subscription-plans', { method: 'POST', body: JSON.stringify(p) });
export const updateSubscriptionPlan = (id: string, p: Partial<SubscriptionPlan>) =>
  api<SubscriptionPlan>(`/api/subscription-plans/${id}`, { method: 'PUT', body: JSON.stringify(p) });
export const deleteSubscriptionPlan = (id: string) =>
  api<void>(`/api/subscription-plans/${id}`, { method: 'DELETE' });

// Subscriptions
export const fetchSubscriptions = () => api<Subscription[]>('/api/subscriptions');
export const cancelSubscription = (id: string) =>
  api<{ id: string; status: string }>(`/api/subscriptions/${id}/cancel`, { method: 'POST' });

// Subscribe (public)
export const createSubscription = (data: {
  plan_id: string;
  customer: { name: string; email: string; phone: string; address: string };
  extras?: { name: string; qty: number; price: number; category: string }[];
  extras_mode?: 'recurring' | 'onetime';
}) => api<{ url: string }>('/api/subscribe', { method: 'POST', body: JSON.stringify(data) });

// Reviews
export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  avatar: string;
  image_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const fetchPublicReviews = () => api<Review[]>('/api/reviews');
export const fetchAdminReviews = () => api<Review[]>('/api/reviews/admin');
export const createReview = (r: Partial<Review>) =>
  api<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(r) });
export const updateReview = (id: string, r: Partial<Review>) =>
  api<Review>(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify(r) });
export const deleteReview = (id: string) =>
  api<void>(`/api/reviews/${id}`, { method: 'DELETE' });

// Order Tracking (public)
export const fetchTrackOrder = (code: string) =>
  api<OrderTracking>(`/api/track/${code.toUpperCase()}`);

// Order Tracking (admin)
export const updateOrderTracking = (id: string, data: { tracking_step?: number; tracking_note?: string }) =>
  api<{ id: string; tracking_step?: number; tracking_note?: string }>(`/api/orders/${id}/tracking`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
