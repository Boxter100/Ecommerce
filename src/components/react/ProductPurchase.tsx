import { useMemo, useState } from 'react';
import { addToCart } from '../../stores/cart';
import { stockForSize } from '../../lib/sizes';
import type { Product } from '../../lib/types';

export default function ProductPurchase({ product }: { product: Product }) {
  const sizes = product.sizes;

  const sizeWithStock = useMemo(
    () => sizes.filter((s) => stockForSize(product, s) > 0),
    [product, sizes],
  );

  const [size, setSize] = useState<string>(
    sizeWithStock[0] ?? '',
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedStock = size ? stockForSize(product, size) : 0;
  const max = Math.max(selectedStock, 1);
  const noStock = sizeWithStock.length === 0;

  function handleSelect(s: string) {
    if (stockForSize(product, s) <= 0) return;
    if (s !== size) setQty(1);
    setSize(s);
  }

  function handleAdd() {
    if (noStock || !size || selectedStock <= 0) return;
    const ok = addToCart(product, size, qty);
    if (!ok) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/50 dark:text-paper/50">
          Elige tu talla {noStock && <span className="text-ember">· Agotado</span>}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-paper/50">Talla única</p>
          )}
          {sizes.map((s) => {
            const avail = stockForSize(product, s);
            const soldOut = avail <= 0;
            const selected = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                disabled={soldOut}
                aria-pressed={selected}
                aria-disabled={soldOut}
                title={soldOut ? `${s} · Agotado` : s}
                className={`relative min-w-12 rounded-lg border px-3 py-2.5 text-sm font-bold transition-all ${
                  soldOut
                    ? 'cursor-not-allowed border-ink/10 bg-ink/5 text-ink/35 line-through decoration-ember/60 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/35'
                    : selected
                      ? 'border-ember bg-ember text-white shadow-hard-sm'
                      : 'border-line hover:border-ink dark:border-line-dark dark:hover:border-paper'
                }`}
              >
                {s}
                {soldOut && (
                  <span className="block text-[10px] font-bold uppercase normal-case tracking-wider text-ember/70">
                    agotado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 rounded-xl border border-line dark:border-line-dark">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Reducir cantidad"
            className="grid h-12 w-12 place-items-center text-xl"
          >
            −
          </button>
          <span className="w-8 text-center font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            aria-label="Aumentar cantidad"
            className="grid h-12 w-12 place-items-center text-xl"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={noStock || !size}
          onClick={handleAdd}
          className={`flex-1 rounded-xl px-5 py-3.5 font-bold uppercase tracking-widest transition-all ${
            added
              ? 'bg-ember text-white'
              : noStock
                ? 'cursor-not-allowed bg-ink/10 text-ink/40 dark:bg-paper/10 dark:text-paper/40'
                : 'bg-ink text-paper shadow-hard hover:-translate-y-0.5 hover:bg-ember hover:text-white dark:bg-paper dark:text-ink dark:hover:bg-ember dark:hover:text-white'
          }`}
        >
          {noStock ? 'Agotado' : added ? '✓ En el carrito' : 'Añadir al carrito'}
        </button>
      </div>

      {size && selectedStock > 0 ? (
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Talla {size} · disponible: <span className="font-semibold">{selectedStock} uds</span> · Envío gratis en pedidos superiores a $1,140
        </p>
      ) : (
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {noStock
            ? 'Este producto está agotado en todas las tallas.'
            : 'Selecciona una talla con stock disponible.'}
        </p>
      )}
    </div>
  );
}