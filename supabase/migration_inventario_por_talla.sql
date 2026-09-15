-- ============================================================
-- VUELTA · Inventario por tallas (cm)
-- Ejecutar en el SQL Editor de Supabase cuando la BD ya existía.
-- ============================================================

-- 1) Columna size_range en products
alter table public.products
  add column if not exists size_range text not null default 'both'
  check (size_range in ('22-25.5', '25-28.5', 'both'));

-- 2) Tabla de inventario por talla
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size_cm numeric(4,1) not null check (size_cm >= 0),
  stock integer not null default 1 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size_cm)
);

create index if not exists product_sizes_product_idx on public.product_sizes (product_id);

-- 3) RLS
alter table public.product_sizes enable row level security;

drop policy if exists "product_sizes_read_all" on public.product_sizes;
create policy "product_sizes_read_all" on public.product_sizes
  for select using (true);

drop policy if exists "product_sizes_admin_all" on public.product_sizes;
create policy "product_sizes_admin_all" on public.product_sizes
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Backfill: productos existentes (que aún no tienen tallas en cm)
--    Se reasigna el rango completo 'both' (22–28.5 cm) con stock = 1 por talla.
insert into public.product_sizes (product_id, size_cm, stock)
select p.id, s.size_cm, 1
from public.products p
cross join (
  values (22.0),(22.5),(23.0),(23.5),(24.0),(24.5),(25.0),(25.5),
         (26.0),(26.5),(27.0),(27.5),(28.0),(28.5)
) as s(size_cm)
where not exists (select 1 from public.product_sizes ps where ps.product_id = p.id)
on conflict (product_id, size_cm) do nothing;

-- 5) Re-sincroniza espejos en products (tamaños en cm y stock total = suma).
--    En una migración sobre datos existentes no hay aún config manual, así que
--    el rango se fija a 'both'. El stock se calcula SIEMPRE desde product_sizes.
update public.products p
set size_range = 'both',
    sizes = (
      select jsonb_agg(to_char(ps.size_cm, 'FM9990.0') || ' cm' order by ps.size_cm)
      from public.product_sizes ps
      where ps.product_id = p.id
    ),
    stock = coalesce(
      (select sum(ps.stock) from public.product_sizes ps where ps.product_id = p.id),
      0
    )
where exists (select 1 from public.product_sizes ps where ps.product_id = p.id)
  and (p.stock <> coalesce((select sum(ps2.stock) from public.product_sizes ps2 where ps2.product_id = p.id), 0)
       or jsonb_array_length(p.sizes) <> (select count(*) from public.product_sizes ps3 where ps3.product_id = p.id));