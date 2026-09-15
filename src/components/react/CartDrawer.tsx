import { useStore } from '@nanostores/react';
import { useState } from 'react';
import {
  cart,
  cartOpen,
  closeCart,
  removeFromCart,
  setLineQty,
  subtotalValue,
} from '../../stores/cart';
import { formatCents } from '../../lib/format';

export default function CartDrawer() {
  const open = useStore(cartOpen);
  const lines = Object.values(useStore(cart));
  const subtotal = useStore(subtotalValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.product.id,
            size: l.size,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de pago');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={open ? 'fixed' : 'hidden'}>
      <div
        className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compra"
        className="animate-rise fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-paper dark:border-line-dark dark:bg-ink"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-line-dark">
          <h2 className="font-display text-2xl">TU CARRITO</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:bg-ember hover:text-white dark:border-line-dark"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <svg className="h-14 w-14 text-ink/20 dark:text-paper/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="font-semibold">Tu carrito está vacío</p>
              <a href="/productos" className="bg-ember px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5">
                Ver productos
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => {
                const key = `${line.product.id}::${line.size}`;
                return (
                  <li key={key} className="flex gap-3 rounded-xl border border-line p-3 dark:border-line-dark">
                    <img
                      src={line.product.images[0]}
                      alt={line.product.name}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate font-semibold leading-tight">{line.product.name}</p>
                      <p className="text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50">
                        Talla {line.size} · {formatCents(line.product.price_cents)}
                      </p>
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setLineQty(key, line.qty - 1)}
                          aria-label="Restar cantidad"
                          className="grid h-7 w-7 place-items-center rounded border border-line dark:border-line-dark"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setLineQty(key, line.qty + 1)}
                          aria-label="Sumar cantidad"
                          className="grid h-7 w-7 place-items-center rounded border border-line dark:border-line-dark"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(key)}
                          className="ml-auto text-xs font-semibold text-ink/40 underline-offset-2 hover:text-ember dark:text-paper/40"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line px-5 py-4 dark:border-line-dark">
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-wider text-ink/60 dark:text-paper/60">Subtotal</span>
              <span className="font-display text-xl">{formatCents(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">
              Envío e impuestos calculados en el checkout.
            </p>
            {error && <p className="mt-2 text-sm font-semibold text-ember">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={checkout}
              className="mt-4 w-full bg-ink px-4 py-3.5 font-bold uppercase tracking-widest text-paper transition-all hover:-translate-y-0.5 hover:bg-ember hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-paper dark:text-ink dark:hover:bg-ember dark:hover:text-white"
            >
              {busy ? 'Procesando…' : 'Pagar con Stripe →'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}