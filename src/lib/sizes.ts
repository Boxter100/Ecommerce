import type { Product } from './types';

export type SizeRange = '22-25.5' | '25-28.5' | 'both';

const CM_22_25 = [22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5];
const CM_25_28 = [25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5];

function buildRange(from: number, to: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += 0.5) {
    out.push(Number(v.toFixed(1)));
  }
  return out;
}

/* Tallas de 25 a 28.5 solapadas con 22-25.5 para no duplicar 25 / 25.5 */
const CM_BOTH = buildRange(22, 28.5);

const CM_BY_RANGE: Record<SizeRange, number[]> = {
  '22-25.5': CM_22_25,
  '25-28.5': CM_25_28,
  both: CM_BOTH,
};

export function sizeLabel(cm: number): string {
  const value = Number.isInteger(cm) ? String(Math.round(cm)) : cm.toFixed(1);
  return `${value} cm`;
}

export function sizeLabels(range: SizeRange): string[] {
  return CM_BY_RANGE[range].map(sizeLabel);
}

export function sizeCmValues(range: SizeRange): number[] {
  return CM_BY_RANGE[range];
}

export const SIZE_RANGES: Record<SizeRange, string[]> = Object.fromEntries(
  (Object.keys(CM_BY_RANGE) as SizeRange[]).map((r) => [r, sizeLabels(r)]),
) as Record<SizeRange, string[]>;

export const SIZE_RANGE_OPTIONS: { value: SizeRange; label: string; hint: string }[] = [
  { value: '22-25.5', label: '22 cm a 25.5 cm', hint: 'Infantil / tallas pequeñas' },
  { value: '25-28.5', label: '25 cm a 28.5 cm', hint: 'Tallaje adulto compacto' },
  { value: 'both', label: 'Ambas', hint: '22 cm a 28.5 cm completa' },
];

/** Convierte la etiqueta "22.5 cm" en 22.5, o null si no es válida. */
export function parseSizeLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = /^\s*([0-9]+(?:\.[0-9]+)?)\s*cm/i.exec(label);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Stock disponible de un producto para una talla concreta. */
export function stockForSize(product: Product, size: string): number {
  if (product.stockBySize) {
    return product.stockBySize[size] ?? 0;
  }
  return product.stock;
}

/** Suma del stock de todas las tallas. */
export function totalStock(stockBySize: Record<string, number>): number {
  return Object.values(stockBySize).reduce((sum, n) => sum + (Number(n) || 0), 0);
}