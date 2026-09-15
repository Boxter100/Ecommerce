import { useState } from 'react';

export default function SearchBox({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    window.location.href = url.toString();
  }

  return (
    <form role="search" onSubmit={submit} className="relative">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40 dark:text-paper/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nombre o marca…"
        aria-label="Buscar productos"
        className="w-full rounded-xl border border-line bg-white/60 py-3 pl-11 pr-24 text-sm outline-none transition-colors placeholder:text-ink/40 focus:border-ember dark:border-line-dark dark:bg-ink-2 dark:placeholder:text-paper/40"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-paper transition-colors hover:bg-ember dark:bg-paper dark:text-ink"
      >
        Buscar
      </button>
    </form>
  );
}