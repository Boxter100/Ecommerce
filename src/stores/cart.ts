import { atom, computed, map, onMount } from 'nanostores';
import type { CartLine, Product } from '../lib/types';
import { stockForSize } from '../lib/sizes';

type CartMap = Record<string, CartLine>;

const STORAGE_KEY = 'vuelta.cart.v1';

export const cart = map<CartMap>({});

function persist() {
  onMount(cart, () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) cart.set(JSON.parse(raw) as CartMap);
    } catch {
      /* ignore corrupted storage */
    }
    return cart.subscribe((value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* ignore quota errors */
      }
    });
  });
}
persist();

export function lineKey(product: Product, size: string): string {
  return `${product.id}::${size}`;
}

export function cartLines(): CartLine[] {
  return Object.values(cart.get());
}

export function cartCount(): number {
  return cartLines().reduce((sum, line) => sum + line.qty, 0);
}

export function subtotalCents(): number {
  return cartLines().reduce(
    (sum, line) => sum + line.product.price_cents * line.qty,
    0,
  );
}

export const cartOpen = atom(false);

export function openCart(): void {
  cartOpen.set(true);
}

export function closeCart(): void {
  cartOpen.set(false);
}

export const cartBump = atom(0);

export const cartCountValue = computed(cart, () =>
  cartLines().reduce((sum, line) => sum + line.qty, 0),
);

export const subtotalValue = computed(cart, () =>
  cartLines().reduce(
    (sum, line) => sum + line.product.price_cents * line.qty,
    0,
  ),
);

export function addToCart(
  product: Product,
  size: string,
  qty = 1,
): boolean {
  const avail = stockForSize(product, size);
  if (avail <= 0) return false;
  const key = lineKey(product, size);
  const current = cart.get()[key];
  const max = Math.max(avail, 1);
  const next = Math.min((current?.qty ?? 0) + qty, max);
  cart.setKey(key, { product, size, qty: next });
  cartBump.set(cartBump.get() + 1);
  flash(product);
  return next >= (current?.qty ?? 0) + qty;
}

export function removeFromCart(key: string): void {
  const current = cart.get();
  const { [key]: _removed, ...rest } = current;
  cart.set(rest);
}

export function setLineQty(key: string, qty: number): void {
  const line = cart.get()[key];
  if (!line) return;
  if (qty <= 0) {
    removeFromCart(key);
    return;
  }
  const avail = stockForSize(line.product, line.size);
  const cap = avail > 0 ? avail : line.qty;
  cart.setKey(key, { ...line, qty: Math.min(qty, cap) });
}

export function clearCart(): void {
  cart.set({});
}

export interface ToastData {
  id: number;
  name: string;
  image?: string;
}

export const toast = atom<ToastData | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function flash(product: Product): void {
  toast.set({
    id: Date.now(),
    name: product.name,
    image: product.images[0] ?? undefined,
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.set(null), 2600);
}