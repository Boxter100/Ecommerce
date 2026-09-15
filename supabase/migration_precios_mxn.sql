-- ============================================================
-- VUELTA · Precios: euros → pesos mexicanos (×19)
-- Ejecutar en el SQL Editor de Supabase.
--
-- Aplica solo a los productos de la semilla (por slug). Es idempotente:
-- solo actualiza la fila si todavía conserva el precio en euros.
-- No toca productos creados manualmente (ej. 'test').
-- ============================================================

with px (slug, price_cents, original_price_cents) as (
  values
    ('runner-pro-1',     245100, 302100),
    ('urban-canvas-01',  142310, null),
    ('court-legend-low', 170810, 208810),
    ('trail-surge-gtx',  293550, null),
    ('retro-court-84',   161310, 189810),
    ('street-knit-mono', 189810, null),
    ('aero-bounce-5',    216600, 254600),
    ('mudline-low',      208810, null)
)
update public.products p
set price_cents = px.price_cents,
    original_price_cents = px.original_price_cents,
    updated_at = now()
from px
where p.slug = px.slug
  and p.price_cents = px.price_cents / 19
  and coalesce(p.original_price_cents, 0) = coalesce(px.original_price_cents, 0) / 19;