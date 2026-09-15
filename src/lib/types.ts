export interface Category {
  id: number;
  name: string;
  slug: string;
}

import type { SizeRange } from './sizes';

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  category_id: number | null;
  category: Category | null;
  size_range: SizeRange;
  sizes: string[];
  stock: number;
  stockBySize?: Record<string, number>;
  images: string[];
  is_featured: boolean;
  active: boolean;
  created_at: string;
}

export interface CartLine {
  product: Product;
  size: string;
  qty: number;
}

export interface PaymentIntent {
  url: string;
}

export interface Order {
  id: string;
  stripe_session_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount_total_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price_cents: number;
  size: string | null;
  quantity: number;
}

export interface DashboardStats {
  products: number;
  lowStock: number;
  orders: number;
  revenueCents: number;
  recentOrders: Order[];
}