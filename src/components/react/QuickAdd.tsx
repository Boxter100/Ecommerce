import { useState } from 'react';
import { addToCart } from '../../stores/cart';
import { stockForSize } from '../../lib/sizes';
import type { Product } from '../../lib/types';

export default function QuickAdd({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  const availableSize = product.sizes.find((s) => stockForSize(product, s) > 0);

  function handleAdd() {
    if (!availableSize) return;
    const ok = addToCart(product, availableSize, 1);
    if (!ok) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const disabled = !availableSize;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleAdd}
      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
        added
          ? 'border-transparent bg-ember text-white'
          : disabled
            ? 'cursor-not-allowed border-line text-ink/30 dark:border-line-dark dark:text-paper/30'
            : 'border-line hover:-translate-y-0.5 hover:bg-ink hover:text-paper dark:border-line-dark dark:hover:bg-paper dark:hover:text-ink'
      }`}
    >
      {disabled ? 'Agotado' : added ? '✓ Añadido' : 'Añadir +'}
    </button>
  );
}