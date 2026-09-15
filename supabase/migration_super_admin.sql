-- ============================================================
-- VUELTA · Roles: admin + super_admin
-- Ejecutar en el SQL Editor de Supabase cuando la BD ya existía.
-- ============================================================

-- 1) Amplía el check constraint de profiles (incluye 'super_admin')
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

-- 2) is_admin() → admin o super_admin
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

-- 3) Nuevo helper is_super_admin()
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

-- 4) Promoción de tu cuenta (reemplaza por tu email):
--    update public.profiles set role = 'super_admin'
--    where email = 'TU_EMAIL';