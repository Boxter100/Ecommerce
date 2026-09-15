import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from '../../stores/cart';
import type { ToastData } from '../../stores/cart';

const EXIT_MS = 320;

export default function Toast() {
  const current = useStore(toast);
  const [item, setItem] = useState<ToastData | null>(null);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (current) {
      clearTimeout(exitTimer.current);
      setItem(current);
      setLeaving(false);
    } else if (item) {
      setLeaving(true);
      exitTimer.current = setTimeout(() => {
        setItem(null);
        setLeaving(false);
      }, EXIT_MS);
    }
  }, [current]);

  if (!item) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-16 z-[60]">
      <div className={leaving ? 'animate-toast-out' : 'animate-toast-in'}>
        <div
          role="status"
          className="relative flex items-center gap-3 rounded-2xl border-2 border-line bg-paper/95 py-3 pl-3 pr-5 shadow-[6px_6px_0_var(--color-ember)] backdrop-blur dark:border-line-dark dark:bg-ink-2/95"
        >
          <span
            aria-hidden="true"
            className="absolute -top-[7px] right-7 h-3.5 w-3.5 rotate-45 rounded-[2px] border-l-2 border-t-2 border-line bg-paper dark:border-line-dark dark:bg-ink-2"
          />
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover dark:border-line-dark"
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ember text-white">
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
            </span>
          )}
          <div className="min-w-0 max-w-56">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ember">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-ember text-white animate-check">
                <svg
                  className="h-2.5 w-2.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              Añadido al carrito
            </p>
            <p className="truncate font-display text-lg leading-tight tracking-wide">
              {item.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}