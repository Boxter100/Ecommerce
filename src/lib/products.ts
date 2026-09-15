import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Product } from './types';
import type { SizeRange } from './sizes';
import { sizeLabel } from './sizes';
import { demoCategories, demoProducts } from '../data/demo';

const PRODUCT_SELECT = `id, name, slug, brand, description, price_cents, original_price_cents, category_id, size_range, sizes, stock, images, is_featured, active, created_at, category:categories(id, name, slug)`;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  category_id: number | null;
  size_range: unknown;
  sizes: unknown;
  stock: number;
  images: unknown;
  is_featured: boolean;
  active: boolean;
  created_at: string;
  category:
    | { id: number; name: string; slug: string }
    | { id: number; name: string; slug: string }[]
    | null;
}

export function mapProduct(row: ProductRow): Product {
  const raw = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    ...row,
    size_range: (row.size_range as SizeRange) || 'both',
    category: raw ?? null,
    sizes: Array.isArray(row.sizes) ? row.sizes.map(String) : [],
    images: Array.isArray(row.images) ? row.images.map(String) : [],
  };
}

async function fetchStockBySize(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, Record<string, number>>> {
  const map = new Map<string, Record<string, number>>();
  if (ids.length === 0) return map;
  const { data, error } = await client
    .from('product_sizes')
    .select('product_id, size_cm, stock')
    .in('product_id', ids);
  if (error) return map;
  for (const row of data ?? []) {
    const pid = String(row.product_id);
    const entry = map.get(pid) ?? {};
    entry[sizeLabel(Number(row.size_cm))] = Number(row.stock) || 0;
    map.set(pid, entry);
  }
  return map;
}

export async function getCategories(
  client: SupabaseClient | null,
): Promise<Category[]> {
  if (!client) return demoCategories;
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface GetProductsOptions {
  category?: string;
  q?: string;
  featured?: boolean;
  includeInactive?: boolean;
  limit?: number;
}

function filterDemo(opts: GetProductsOptions): Product[] {
  let list = demoProducts.filter((p) => p.active);
  if (opts.featured) list = list.filter((p) => p.is_featured);
  if (opts.category) list = list.filter((p) => p.category?.slug === opts.category);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q),
    );
  }
  list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (opts.limit) list = list.slice(0, opts.limit);
  return list;
}

export async function getProducts(
  client: SupabaseClient | null,
  opts: GetProductsOptions = {},
): Promise<Product[]> {
  if (!client) return filterDemo(opts);

  let query = client.from('products').select(PRODUCT_SELECT);

  if (!opts.includeInactive) query = query.eq('active', true);
  if (opts.featured) query = query.eq('is_featured', true);

  if (opts.category) {
    const { data: category } = await client
      .from('categories')
      .select('id')
      .eq('slug', opts.category)
      .maybeSingle();
    if (!category) return [];
    query = query.eq('category_id', category.id);
  }

  if (opts.q) {
    query = query.or(`name.ilike.%${opts.q}%,brand.ilike.%${opts.q}%`);
  }

  query = query.order('created_at', { ascending: false });
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((row) => mapProduct(row as ProductRow));
  const bySize = await fetchStockBySize(client, rows.map((p) => p.id));
  for (const p of rows) p.stockBySize = bySize.get(p.id);
  return rows;
}

export async function getProductBySlug(
  client: SupabaseClient | null,
  slug: string,
): Promise<Product | null> {
  if (!client) return demoProducts.find((p) => p.slug === slug && p.active) ?? null;

  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  const product = mapProduct(data as ProductRow);
  const bySize = await fetchStockBySize(client, [product.id]);
  product.stockBySize = bySize.get(product.id);
  return product;
}

export async function getProductById(
  client: SupabaseClient | null,
  id: string,
): Promise<Product | null> {
  if (!client) return demoProducts.find((p) => p.id === id) ?? null;

  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const product = mapProduct(data as ProductRow);
  const bySize = await fetchStockBySize(client, [product.id]);
  product.stockBySize = bySize.get(product.id);
  return product;
}