import { useRef, useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  discount?: number | null;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

export default function ProductGallery({
  images,
  alt,
  discount = null,
}: ProductGalleryProps) {
  const count = images.length;
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  function select(index: number) {
    if (index < 0 || index >= count) return;
    setActive(index);
  }

  const prev = () => setActive((i) => (i - 1 + count) % count);
  const next = () => setActive((i) => (i + 1) % count);

  function onThumbsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (count <= 1) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const index =
      e.key === 'ArrowRight' ? (active + 1) % count : (active - 1 + count) % count;
    setActive(index);
    thumbsRef.current?.querySelectorAll('button')[index]?.focus();
  }

  if (count === 0) return null;

  return (
    <div>
      <div className="card-hover group relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-paper-2 dark:border-line-dark dark:bg-ink-2">
        {discount !== null && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-ember px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm">
            −{discount}%
          </span>
        )}

        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === active ? alt : ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              i === active
                ? 'z-[1] scale-100 opacity-100'
                : 'scale-105 opacity-0'
            }`}
          />
        ))}

        {count > 1 && (
          <>
            <span className="absolute right-4 top-4 z-10 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold tabular-nums tracking-wider text-paper backdrop-blur dark:bg-paper/85 dark:text-ink">
              {active + 1} / {count}
            </span>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 hover:bg-ember focus-visible:opacity-100"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 hover:bg-ember focus-visible:opacity-100"
            >
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={thumbsRef}
          role="group"
          aria-label={`Galería de ${alt}`}
          onKeyDown={onThumbsKeyDown}
          className="mt-4 flex gap-3 overflow-x-auto pb-1"
        >
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              onClick={() => select(i)}
              aria-label={`Ver imagen ${i + 1} de ${count}`}
              aria-current={i === active ? 'true' : undefined}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                i === active
                  ? 'border-ember opacity-100 shadow-hard-sm'
                  : 'border-line opacity-70 hover:-translate-y-0.5 hover:opacity-100 dark:border-line-dark'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}