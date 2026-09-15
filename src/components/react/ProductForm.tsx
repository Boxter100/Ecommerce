import { useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase/browser';
import type { Category, Product } from '../../lib/types';
import type { SizeRange } from '../../lib/sizes';
import {
  SIZE_RANGE_OPTIONS,
  sizeLabels,
  parseSizeLabel,
  totalStock,
} from '../../lib/sizes';

interface ProductFormProps {
  categories: Category[];
  initial?: Product | null;
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pesos(cents: number | null): string {
  return cents ? (cents / 100).toFixed(2) : '';
}

function defaultStockMap(range: SizeRange, stockBySize?: Record<string, number>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const label of sizeLabels(range)) {
    const v = stockBySize?.[label];
    map[label] = Number.isInteger(v) && (v ?? 0) >= 0 ? (v as number) : 1;
  }
  return map;
}

export default function ProductForm({ categories, initial }: ProductFormProps) {
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [price, setPrice] = useState(pesos(initial?.price_cents ?? null));
  const [originalPrice, setOriginalPrice] = useState(
    pesos(initial?.original_price_cents ?? null),
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(
    initial?.category_id ? String(initial.category_id) : '',
  );
  const [range, setRange] = useState<SizeRange>(initial?.size_range ?? 'both');
  const [stockMap, setStockMap] = useState<Record<string, number>>(() =>
    defaultStockMap(initial?.size_range ?? 'both', initial?.stockBySize),
  );
  const [images, setImages] = useState((initial?.images ?? []).join('\n'));
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = sizeLabels(range);
  const total = totalStock(stockMap);

  function autoSlug() {
    if (!slug) setSlug(slugify(name));
  }

  function handleRangeChange(next: SizeRange) {
    setRange(next);
    setStockMap(defaultStockMap(next, stockMap));
  }

  function handleStockChange(label: string, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw)));
    setStockMap((prev) => ({ ...prev, [label]: Number.isFinite(n) ? n : 0 }));
  }

  function parseCents(value: string): number | null {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  async function saveSizes(supabase: ReturnType<typeof createBrowserSupabase>, productId: string) {
    const rows = labels
      .map((label) => ({
        product_id: productId,
        size_cm: parseSizeLabel(label),
        stock: stockMap[label] ?? 0,
      }))
      .filter((r): r is { product_id: string; size_cm: number; stock: number } => r.size_cm !== null);

    await supabase.from('product_sizes').delete().eq('product_id', productId);
    if (rows.length > 0) {
      const { error } = await supabase.from('product_sizes').insert(rows);
      if (error) throw error;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const priceCents = parseCents(price);
    const originalCents = originalPrice ? parseCents(originalPrice) : null;

    if (!name.trim() || !slug.trim()) {
      setError('Nombre y slug son obligatorios');
      setBusy(false);
      return;
    }
    if (priceCents === null || priceCents <= 0) {
      setError('Introduce un precio válido');
      setBusy(false);
      return;
    }
    if (originalCents !== null && originalCents <= priceCents) {
      setError('El precio original debe ser mayor que el precio actual');
      setBusy(false);
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim() || null,
      slug: slugify(slug) || slugify(name),
      description: description.trim() || null,
      price_cents: priceCents,
      original_price_cents: originalCents,
      category_id: categoryId ? Number(categoryId) : null,
      size_range: range,
      sizes: labels,
      stock: total,
      images: images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      is_featured: featured,
      active,
    };

    try {
      const supabase = createBrowserSupabase();
      if (initial) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', initial.id);
        if (error) throw error;
        await saveSizes(supabase, initial.id);
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        await saveSizes(supabase, (data as { id: string }).id);
      }
      window.location.href = '/admin/productos';
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes('duplicate')
          ? 'El slug ya está en uso por otro producto'
          : e instanceof Error
            ? e.message
            : 'Error guardando el producto',
      );
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-white/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-ember dark:border-line-dark dark:bg-ink-2';
  const labelClass =
    'text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-paper/60';

  return (
    <form onSubmit={submit} className="mt-8 grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Nombre *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} onBlur={autoSlug} className={inputClass} placeholder="Runner PRO 1" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Marca</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} placeholder="VUELTA" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Slug (URL) *</span>
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="runner-pro-1" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Categoría</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Precio ($ MXN) *</span>
          <input required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="2.451.00" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Precio original ($ MXN, opcional para oferta)</span>
          <input inputMode="decimal" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className={inputClass} placeholder="3.021.00" />
        </label>
      </div>

      {/* Rango de tallas */}
      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Rango de tallas</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {SIZE_RANGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors ${
                range === opt.value
                  ? 'border-ember bg-ember/10 ring-1 ring-ember'
                  : 'border-line hover:border-ember/50 dark:border-line-dark'
              }`}
            >
              <input
                type="radio"
                name="size-range"
                value={opt.value}
                checked={range === opt.value}
                onChange={() => handleRangeChange(opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-xs text-ink/50 dark:text-paper/50">{opt.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Stock por talla */}
      <fieldset className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <legend className={labelClass}>Stock por talla</legend>
          <span className="rounded-lg border border-line px-3 py-1 text-xs font-bold uppercase tracking-wider dark:border-line-dark">
            Stock total: <span className="text-ember">{total} uds</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {labels.map((label) => (
            <label key={label} className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink/70 dark:text-paper/70">{label}</span>
              <input
                type="number"
                min={0}
                value={stockMap[label] ?? 1}
                onChange={(e) => handleStockChange(label, e.target.value)}
                aria-label={`Stock ${label}`}
                className={inputClass}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Si una talla tiene 0 no se podrá comprar, pero seguirá visible como agotada en la tienda.
        </p>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Descripción</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="Zapatilla de running con placa de fibra y espuma de retorno de energía…" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Imágenes (una URL por línea)</span>
        <textarea value={images} onChange={(e) => setImages(e.target.value)} rows={3} className={inputClass} placeholder="/images/products/runner-pro-1.svg" />
      </label>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[var(--color-ember)]" />
          Destacado en portada
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-ember)]" />
          Visible en la tienda
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-ember px-6 py-3 font-bold uppercase tracking-widest text-white shadow-hard-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <a href="/admin/productos" className="border-2 border-ink px-6 py-3 font-bold uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink">
          Cancelar
        </a>
      </div>
    </form>
  );
}