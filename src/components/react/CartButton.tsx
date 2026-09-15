import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartBump, cartCountValue, openCart } from '../../stores/cart';

export default function CartButton() {
  const count = useStore(cartCountValue);
  const bump = useStore(cartBump);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (bump <= 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 650);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrito (${count} artículos)`}
      title="Carrito"
      className={`relative grid h-10 w-10 place-items-center rounded-full border border-line transition-colors hover:bg-ember hover:text-white dark:border-line-dark ${
        pulse ? 'animate-bump' : ''
      }`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}