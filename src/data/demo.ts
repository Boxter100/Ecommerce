import type { Category, Product } from '../lib/types';
import { sizeLabels } from '../lib/sizes';

/**
 * Catálogo de demostración que se usa mientras Supabase no está conectado
 * (modo demo). Es la misma semilla que hay en supabase/seed.sql.
 */

export const demoCategories: Category[] = [
  { id: 1, name: 'Running', slug: 'running' },
  { id: 2, name: 'Estilo de vida', slug: 'estilo-de-vida' },
  { id: 3, name: 'Baloncesto', slug: 'baloncesto' },
  { id: 4, name: 'Trail', slug: 'trail' },
];

const cat = (id: number): Category => demoCategories.find((c) => c.id === id)!;

const allBoth = sizeLabels('both');
const allLow = sizeLabels('22-25.5');
const allHigh = sizeLabels('25-28.5');

const stock = (map: Record<string, number>): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) out[`${k} cm`] = v;
  return out;
};

export const demoProducts: Product[] = [
  {
    id: 'demo-runner-pro-1',
    name: 'Runner PRO 1',
    slug: 'runner-pro-1',
    brand: 'VUELTA',
    description:
      'Zapatilla de running con placa de fibra y espuma de retorno de energía. Pensada para rodar rápido a diario.',
    price_cents: 245100,
    original_price_cents: 302100,
    category_id: 1,
    category: cat(1),
    size_range: 'both',
    sizes: allBoth,
    stock: 29,
    stockBySize: stock({
      '22': 2, '22.5': 1, '23': 4, '23.5': 0, '24': 3, '24.5': 2,
      '25': 0, '25.5': 5, '26': 2, '26.5': 3, '27': 1, '27.5': 4,
      '28': 0, '28.5': 2,
    }),
    images: ['/images/products/runner-pro-1.svg'],
    is_featured: true,
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'demo-urban-canvas-01',
    name: 'Urban Canvas 01',
    slug: 'urban-canvas-01',
    brand: 'KALLE',
    description:
      'Silueta de lona de corte limpio, ideal para el día a día. Suela vulcanizada y horma cómoda.',
    price_cents: 142310,
    original_price_cents: null,
    category_id: 2,
    category: cat(2),
    size_range: '22-25.5',
    sizes: allLow,
    stock: 15,
    stockBySize: stock({
      '22': 3, '22.5': 2, '23': 0, '23.5': 4, '24': 2, '24.5': 0, '25': 1, '25.5': 3,
    }),
    images: ['/images/products/urban-canvas-01.svg'],
    is_featured: true,
    active: true,
    created_at: '2026-02-02T10:00:00.000Z',
  },
  {
    id: 'demo-court-legend-low',
    name: 'Court Legend Low',
    slug: 'court-legend-low',
    brand: 'PISTA',
    description:
      'Clásico de pista en versión low-top. Piel noble, eva ligera y un toque retro que nunca falla.',
    price_cents: 170810,
    original_price_cents: 208810,
    category_id: 3,
    category: cat(3),
    size_range: '25-28.5',
    sizes: allHigh,
    stock: 13,
    stockBySize: stock({
      '25': 1, '25.5': 2, '26': 3, '26.5': 0, '27': 4, '27.5': 1, '28': 2, '28.5': 0,
    }),
    images: ['/images/products/court-legend-low.svg'],
    is_featured: true,
    active: true,
    created_at: '2026-02-12T10:00:00.000Z',
  },
  {
    id: 'demo-trail-surge-gtx',
    name: 'Trail Surge GTX',
    slug: 'trail-surge-gtx',
    brand: 'CUESTA',
    description:
      'Tripa de montaña con membrana impermeable y taqueado agresivo para terreno técnico.',
    price_cents: 293550,
    original_price_cents: null,
    category_id: 4,
    category: cat(4),
    size_range: 'both',
    sizes: allBoth,
    stock: 19,
    stockBySize: stock({
      '22': 0, '22.5': 1, '23': 1, '23.5': 2, '24': 2, '24.5': 3,
      '25': 3, '25.5': 0, '26': 2, '26.5': 2, '27': 1, '27.5': 1,
      '28': 0, '28.5': 1,
    }),
    images: ['/images/products/trail-surge-gtx.svg'],
    is_featured: true,
    active: true,
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'demo-retro-court-84',
    name: 'Retro Court 84',
    slug: 'retro-court-84',
    brand: 'PISTA',
    description:
      'Homenaje al baloncesto de los 80: ante, caña media y estética vintage que combina con todo.',
    price_cents: 161310,
    original_price_cents: 189810,
    category_id: 3,
    category: cat(3),
    size_range: '25-28.5',
    sizes: allHigh,
    stock: 9,
    stockBySize: stock({
      '25': 2, '25.5': 0, '26': 3, '26.5': 1, '27': 0, '27.5': 2, '28': 1, '28.5': 0,
    }),
    images: ['/images/products/retro-court-84.svg'],
    is_featured: false,
    active: true,
    created_at: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'demo-street-knit-mono',
    name: 'Street Knit Mono',
    slug: 'street-knit-mono',
    brand: 'KALLE',
    description:
      'Tejido de punto monocolor, construcción ligera y perfil bajo. La horma urbana por excelencia.',
    price_cents: 189810,
    original_price_cents: null,
    category_id: 2,
    category: cat(2),
    size_range: '22-25.5',
    sizes: allLow,
    stock: 9,
    stockBySize: stock({
      '22': 1, '22.5': 2, '23': 2, '23.5': 0, '24': 1, '24.5': 1, '25': 0, '25.5': 2,
    }),
    images: ['/images/products/street-knit-mono.svg'],
    is_featured: false,
    active: true,
    created_at: '2026-04-02T10:00:00.000Z',
  },
  {
    id: 'demo-aero-bounce-5',
    name: 'Aero Bounce 5',
    slug: 'aero-bounce-5',
    brand: 'VUELTA',
    description:
      'Amortiguación de doble densidad para zancadas frescas en asfalto. Ligera, ágil, directa.',
    price_cents: 216600,
    original_price_cents: 254600,
    category_id: 1,
    category: cat(1),
    size_range: 'both',
    sizes: allBoth,
    stock: 18,
    stockBySize: stock({
      '22': 2, '22.5': 1, '23': 0, '23.5': 2, '24': 1, '24.5': 2,
      '25': 3, '25.5': 1, '26': 0, '26.5': 2, '27': 2, '27.5': 1,
      '28': 1, '28.5': 0,
    }),
    images: ['/images/products/aero-bounce-5.svg'],
    is_featured: false,
    active: true,
    created_at: '2026-04-20T10:00:00.000Z',
  },
  {
    id: 'demo-mudline-low',
    name: 'Mudline Low',
    slug: 'mudline-low',
    brand: 'CUESTA',
    description:
      'Trail accesible: agarre ventral, refuerzos en la puntera y ajuste seguro sin amarrar.',
    price_cents: 208810,
    original_price_cents: null,
    category_id: 4,
    category: cat(4),
    size_range: 'both',
    sizes: allBoth,
    stock: 11,
    stockBySize: stock({
      '22': 1, '22.5': 0, '23': 1, '23.5': 1, '24': 0, '24.5': 1,
      '25': 2, '25.5': 1, '26': 1, '26.5': 0, '27': 1, '27.5': 1,
      '28': 0, '28.5': 1,
    }),
    images: ['/images/products/mudline-low.svg'],
    is_featured: false,
    active: true,
    created_at: '2026-05-05T10:00:00.000Z',
  },
];