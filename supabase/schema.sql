-- ============================================================
-- VUELTA · Tienda de calzado — Esquema Supabase (Postgres)
-- Ejecutar en el Editor SQL de Supabase: supabase/schema.sql
-- Después lanzar supabase/seed.sql y dar de alta al primer admin.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Categorías ----------
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Productos ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  original_price_cents integer check (original_price_cents is null or original_price_cents >= price_cents),
  category_id bigint references public.categories(id) on delete set null,
  -- Rango de tallas del producto: '22-25.5' | '25-28.5' | 'both'
  size_range text not null default 'both' check (size_range in ('22-25.5', '25-28.5', 'both')),
  -- Etiquetas visibles de tallas (ej. ["22 cm","22.5 cm",...]), espejo de product_sizes
  sizes jsonb not null default '[]'::jsonb,
  -- Stock total = SUMA del stock de product_sizes. No se introduce a mano.
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}'::text[],
  is_featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active);
create index if not exists products_category_idx on public.products (category_id);

-- ---------- Inventario por talla ----------
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size_cm numeric(4,1) not null check (size_cm >= 0),
  stock integer not null default 1 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size_cm)
);

create index if not exists product_sizes_product_idx on public.product_sizes (product_id);

-- ---------- Perfiles (rol de admin) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz not null default now()
);

-- ---------- Órdenes ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent text,
  customer_name text,
  customer_email text,
  amount_total_cents integer not null default 0,
  currency text not null default 'mxn',
  status text not null default 'paid' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  price_cents integer not null,
  size text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_sizes enable row level security;

-- Helper de rol admin (admin o super_admin)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;

-- Helper de rol super admin (solo super_admin)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- Lectura pública para la tienda
create policy "categories_read_all" on public.categories
  for select using (true);
create policy "products_read_all" on public.products
  for select using (true);
create policy "product_sizes_read_all" on public.product_sizes
  for select using (true);

-- Escritura solo para admins
create policy "categories_admin_all" on public.categories
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_admin_all" on public.products
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_sizes_admin_all" on public.product_sizes
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Perfiles: cada usuario ve el suyo; los admins ven todos
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

-- Órdenes: solo admins
create policy "orders_admin_all" on public.orders
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_admin_all" on public.order_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Trigger: perfil al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Actualiza updated_at en productos
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute procedure public.touch_updated_at();

-- ---------- Storage de imágenes de producto ----------
-- Bucket público "products" (solo .webp, máx. 10 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 10485760, array['image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/webp'];

-- Lectura pública y escritura solo para admins
create policy "products_storage_read_public" on storage.objects
  for select using (bucket_id = 'products');

create policy "products_storage_admin_all" on storage.objects
  for all
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

-- ============================================================
-- PRIMER ADMINISTRADOR (reemplaza por tu email):
--   update public.profiles set role = 'super_admin'
--   where email = 'admin@vuelta.store';
-- Roles: 'user' (cliente) · 'admin' · 'super_admin'
-- ============================================================