-- ============================================================
-- VUELTA · Storage de imágenes de producto
-- Ejecutar en el SQL Editor de Supabase cuando la BD ya existía.
-- Crea el bucket público "products" (solo .webp, máx. 10 MB) y
-- las políticas RLS para que solo los admins suban/borren.
-- ============================================================

-- 1) Bucket público "products"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  10485760,
  array['image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/webp'];

-- 2) Lectura pública
drop policy if exists "products_storage_read_public" on storage.objects;
create policy "products_storage_read_public" on storage.objects
  for select
  using (bucket_id = 'products');

-- 3) Escritura y borrado solo para administradores
drop policy if exists "products_storage_admin_all" on storage.objects;
create policy "products_storage_admin_all" on storage.objects
  for all
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());