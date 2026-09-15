-- ============================================================
-- VUELTA · Datos de ejemplo (imágenes SVG locales en /public/images/products)
-- Modelo de inventario por tallas (cm) con product_sizes.
-- ============================================================

insert into public.categories (name, slug) values
  ('Running', 'running'),
  ('Estilo de vida', 'estilo-de-vida'),
  ('Baloncesto', 'baloncesto'),
  ('Trail', 'trail')
on conflict (slug) do nothing;

insert into public.products
  (name, slug, brand, description, price_cents, original_price_cents, category_id, size_range, sizes, stock, images, is_featured, active)
values
  (
    'Runner PRO 1', 'runner-pro-1',
    'VUELTA',
    'Zapatilla de running con placa de fibra y espuma de retorno de energía. Pensada para rodar rápido a diario.',
    245100, 302100,
    (select id from public.categories where slug = 'running'),
    'both',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    29,
    '{"/images/products/runner-pro-1.svg"}',
    true, true
  ),
  (
    'Urban Canvas 01', 'urban-canvas-01',
    'KALLE',
    'Silueta de lona de corte limpio, ideal para el día a día. Suela vulcanizada y horma cómoda.',
    142310, null,
    (select id from public.categories where slug = 'estilo-de-vida'),
    '22-25.5',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm"]',
    15,
    '{"/images/products/urban-canvas-01.svg"}',
    true, true
  ),
  (
    'Court Legend Low', 'court-legend-low',
    'PISTA',
    'Clásico de pista en versión low-top. Piel noble, eva ligera y un toque retro que nunca falla.',
    170810, 208810,
    (select id from public.categories where slug = 'baloncesto'),
    '25-28.5',
    '["25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    13,
    '{"/images/products/court-legend-low.svg"}',
    true, true
  ),
  (
    'Trail Surge GTX', 'trail-surge-gtx',
    'CUESTA',
    'Tripa de montaña con membrana impermeable y taqueado agresivo para terreno técnico.',
    293550, null,
    (select id from public.categories where slug = 'trail'),
    'both',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    19,
    '{"/images/products/trail-surge-gtx.svg"}',
    true, true
  ),
  (
    'Retro Court 84', 'retro-court-84',
    'PISTA',
    'Homenaje al baloncesto de los 80: ante, caña media y estética vintage que combina con todo.',
    161310, 189810,
    (select id from public.categories where slug = 'baloncesto'),
    '25-28.5',
    '["25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    9,
    '{"/images/products/retro-court-84.svg"}',
    false, true
  ),
  (
    'Street Knit Mono', 'street-knit-mono',
    'KALLE',
    'Tejido de punto monocolor, construcción ligera y perfil bajo. La horma urbana por excelencia.',
    189810, null,
    (select id from public.categories where slug = 'estilo-de-vida'),
    '22-25.5',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm"]',
    9,
    '{"/images/products/street-knit-mono.svg"}',
    false, true
  ),
  (
    'Aero Bounce 5', 'aero-bounce-5',
    'VUELTA',
    'Amortiguación de doble densidad para zancadas frescas en asfalto. Ligera, ágil, directa.',
    216600, 254600,
    (select id from public.categories where slug = 'running'),
    'both',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    18,
    '{"/images/products/aero-bounce-5.svg"}',
    false, true
  ),
  (
    'Mudline Low', 'mudline-low',
    'CUESTA',
    'Trail accesible: agarre ventral, refuerzos en la puntera y ajuste seguro sin amarrar.',
    208810, null,
    (select id from public.categories where slug = 'trail'),
    'both',
    '["22 cm","22.5 cm","23 cm","23.5 cm","24 cm","24.5 cm","25 cm","25.5 cm","26 cm","26.5 cm","27 cm","27.5 cm","28 cm","28.5 cm"]',
    11,
    '{"/images/products/mudline-low.svg"}',
    false, true
  )
on conflict (slug) do update
  set name = excluded.name,
      brand = excluded.brand,
      description = excluded.description,
      price_cents = excluded.price_cents,
      original_price_cents = excluded.original_price_cents,
      category_id = excluded.category_id,
      size_range = excluded.size_range,
      sizes = excluded.sizes,
      stock = excluded.stock,
      images = excluded.images,
      is_featured = excluded.is_featured,
      active = excluded.active,
      updated_at = now();

-- Inventario por talla (stock en unidades por talla, 0 = agotada)
insert into public.product_sizes (product_id, size_cm, stock)
select p.id, s.size_cm, s.stock
from public.products p
join (
  values
    ('runner-pro-1', 22.0, 2), ('runner-pro-1', 22.5, 1), ('runner-pro-1', 23.0, 4),
    ('runner-pro-1', 23.5, 0), ('runner-pro-1', 24.0, 3), ('runner-pro-1', 24.5, 2),
    ('runner-pro-1', 25.0, 0), ('runner-pro-1', 25.5, 5), ('runner-pro-1', 26.0, 2),
    ('runner-pro-1', 26.5, 3), ('runner-pro-1', 27.0, 1), ('runner-pro-1', 27.5, 4),
    ('runner-pro-1', 28.0, 0), ('runner-pro-1', 28.5, 2),

    ('urban-canvas-01', 22.0, 3), ('urban-canvas-01', 22.5, 2), ('urban-canvas-01', 23.0, 0),
    ('urban-canvas-01', 23.5, 4), ('urban-canvas-01', 24.0, 2), ('urban-canvas-01', 24.5, 0),
    ('urban-canvas-01', 25.0, 1), ('urban-canvas-01', 25.5, 3),

    ('court-legend-low', 25.0, 1), ('court-legend-low', 25.5, 2), ('court-legend-low', 26.0, 3),
    ('court-legend-low', 26.5, 0), ('court-legend-low', 27.0, 4), ('court-legend-low', 27.5, 1),
    ('court-legend-low', 28.0, 2), ('court-legend-low', 28.5, 0),

    ('trail-surge-gtx', 22.0, 0), ('trail-surge-gtx', 22.5, 1), ('trail-surge-gtx', 23.0, 1),
    ('trail-surge-gtx', 23.5, 2), ('trail-surge-gtx', 24.0, 2), ('trail-surge-gtx', 24.5, 3),
    ('trail-surge-gtx', 25.0, 3), ('trail-surge-gtx', 25.5, 0), ('trail-surge-gtx', 26.0, 2),
    ('trail-surge-gtx', 26.5, 2), ('trail-surge-gtx', 27.0, 1), ('trail-surge-gtx', 27.5, 1),
    ('trail-surge-gtx', 28.0, 0), ('trail-surge-gtx', 28.5, 1),

    ('retro-court-84', 25.0, 2), ('retro-court-84', 25.5, 0), ('retro-court-84', 26.0, 3),
    ('retro-court-84', 26.5, 1), ('retro-court-84', 27.0, 0), ('retro-court-84', 27.5, 2),
    ('retro-court-84', 28.0, 1), ('retro-court-84', 28.5, 0),

    ('street-knit-mono', 22.0, 1), ('street-knit-mono', 22.5, 2), ('street-knit-mono', 23.0, 2),
    ('street-knit-mono', 23.5, 0), ('street-knit-mono', 24.0, 1), ('street-knit-mono', 24.5, 1),
    ('street-knit-mono', 25.0, 0), ('street-knit-mono', 25.5, 2),

    ('aero-bounce-5', 22.0, 2), ('aero-bounce-5', 22.5, 1), ('aero-bounce-5', 23.0, 0),
    ('aero-bounce-5', 23.5, 2), ('aero-bounce-5', 24.0, 1), ('aero-bounce-5', 24.5, 2),
    ('aero-bounce-5', 25.0, 3), ('aero-bounce-5', 25.5, 1), ('aero-bounce-5', 26.0, 0),
    ('aero-bounce-5', 26.5, 2), ('aero-bounce-5', 27.0, 2), ('aero-bounce-5', 27.5, 1),
    ('aero-bounce-5', 28.0, 1), ('aero-bounce-5', 28.5, 0),

    ('mudline-low', 22.0, 1), ('mudline-low', 22.5, 0), ('mudline-low', 23.0, 1),
    ('mudline-low', 23.5, 1), ('mudline-low', 24.0, 0), ('mudline-low', 24.5, 1),
    ('mudline-low', 25.0, 2), ('mudline-low', 25.5, 1), ('mudline-low', 26.0, 1),
    ('mudline-low', 26.5, 0), ('mudline-low', 27.0, 1), ('mudline-low', 27.5, 1),
    ('mudline-low', 28.0, 0), ('mudline-low', 28.5, 1)
) as s(slug, size_cm, stock) on s.slug = p.slug
on conflict (product_id, size_cm) do update
  set stock = excluded.stock;