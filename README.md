# VUELTA · Tienda de calzado

Tienda de calzado construida con **Astro** (islas dinámicas con **React**), **Supabase** (Postgres + Auth + RLS), **Stripe Checkout** (pagos) y **TypeScript**. Modo oscuro incluido.

## Stack

- **Frontend**: Astro 7 (SSR en Vercel) · React 19 islands · Tailwind CSS v4 · nanostores (carrito persistente)
- **Backend/Datos**: Supabase Postgres + Auth (login de admins) + Row Level Security
- **Pagos**: Stripe Checkout (server-side) + webhook para confirmar pedidos y descontar stock
- **Auth admin**: Supabase Auth con cookies (`@supabase/ssr`) y middleware de Astro que protege `/admin`

## Estructura

```text
src/
├── components/
│   ├── react/            # Islas React (carrito, tema, login, CRUD, etc.)
│   └── ...astro          # Cabecera, pie, tarjetas de producto
├── layouts/              # Layout público y Layout Admin
├── lib/                  # Clientes de Supabase, Stripe, helpers, tipos
├── middleware.ts         # Guard de autenticación para /admin
├── pages/
│   ├── index.astro       # Portada
│   ├── productos.astro   # Catálogo + filtros + búsqueda
│   ├── producto/[slug].astro
│   ├── carrito/drawer    # Carrito global (isla en el Layout)
│   ├── checkout/         # Páginas de éxito / cancelado
│   ├── api/              # checkout, webhook Stripe, logout
│   └── admin/            # Panel: login, dashboard, CRUD de productos
└── stores/cart.ts        # Estado del carrito (nanostores + localStorage)
supabase/
├── schema.sql            # Tablas, RLS, triggers (ejecutar en Supabase)
├── migration_super_admin.sql      # Migración de roles (BD ya existente)
├── migration_inventario_por_talla.sql  # Migración a stock por talla (BD ya existente)
├── migration_storage_productos.sql  # Bucket "products" + RLS de Storage (BD ya existente)
└── seed.sql              # Productos, categorías e inventario por talla
scripts/gen-product-images.mjs  # Genera los pósteres SVG de productos
```

## Puesta en marcha

1. **Instalar dependencias**

   ```sh
   pnpm install
   ```

2. **Crear la base de datos en Supabase**

   - Crea un proyecto nuevo en [supabase.com](https://supabase.com).
   - En el **SQL Editor**, ejecuta `supabase/schema.sql` y después `supabase/seed.sql`.
   - Si la base de datos ya existía, ejecuta las migraciones `supabase/migration_*.sql`
     (roles, inventario por talla y **Storage de imágenes**).

3. **Crear el primer administrador**

   Crea un usuario en **Authentication → Users** (o detrás de un form de signup).
   Luego, en el SQL Editor:

   ```sql
   update public.profiles set role = 'super_admin'
   where email = 'tu@email.com';
   ```

   Roles disponibles: `user` (cliente), `admin` y `super_admin`. Todos los que son
   `admin` o `super_admin` acceden al panel y escriben en el catálogo (RLS).

4. **Stripe**

   - Activa el modo test y copia la `Secret key` (sk_test_…).
   - Abre **Developers → Webhooks → Add endpoint** con tu URL
     `https://TU-DOMINIO/api/webhook/stripe` y el evento `checkout.session.completed`
     para obtener el `whsec_…`.

5. **Variables de entorno**

   ```sh
   cp .env.example .env
   # rellena PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
   # SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_SITE_URL
   ```

6. **Desarrollo**

   ```sh
   pnpm dev          # http://localhost:4321
   pnpm run check    # typecheck
   pnpm build        # build de producción (adapter de Vercel)
   ```

Para ver el webhook en local usa el CLI:

```sh
stripe listen --forward-to localhost:4321/api/webhook/stripe
```

> Nota: en local, las imágenes de producto no se envían a Stripe (requiere URLs https).

## Modo demo (sin credenciales)

Si inicias la app sin rellenar `.env`, la tienda arranca igualmente en **modo demo**:

- La portada, el catálogo y las fichas muestran los productos de ejemplo (`src/data/demo.ts`,
  idénticos a `supabase/seed.sql`, con sus SVG locales).
- El carrito, el modo oscuro y todas las islas de React funcionan con normalidad.
- `/admin/login` muestra una guía para conectar Supabase en vez del formulario.
- `/api/checkout` devuelve un mensaje claro hasta que exista `STRIPE_SECRET_KEY`.
- Un indicador fijo «Modo demo» recuerda que el catálogo es de ejemplo.

En cuanto rellenas las credenciales y reinicias el `dev server`, la app usa Supabase y Stripe
reales automáticamente (sin cambios en el código).

## Panel de administración

- `http://localhost:4321/admin/login` — acceso con credenciales de Supabase.
- `http://localhost:4321/admin` — dashboard con estadísticas y últimos pedidos.
- `http://localhost:4321/admin/productos` — CRUD completo (crear, editar, publicar/ocultar, eliminar).
- Sólo los perfiles con `role = 'admin'` o `role = 'super_admin'` pueden escribir (RLS).

## Inventario por talla

El stock se gestiona **por talla** (en cm) en la tabla `product_sizes`, no como un único
número global:

- Al crear un producto se elige un **rango de tallas**: `22–25.5`, `25–28.5` o `Ambas` (22–28.5).
- Cada talla tiene su propio stock (por defecto `1`; `0` = agotada).
- `products.stock` es un **espejo calculado** (suma del stock de todas las tallas) y
  `products.sizes` el espejo de las etiquetas visibles. Nunca se introducen a mano.
- En la ficha del producto las tallas con stock `0` siguen visibles como **agotadas**
  (atenuadas y deshabilitadas), pero no se pueden seleccionar ni añadir al carrito.
- El **checkout** vuelve a validar el stock de la talla en el servidor, y el **webhook de
  Stripe** descuenta el stock de la talla exacta y recalcula el total.

## Notas de seguridad

- Las claves `SUPABASE_SERVICE_ROLE_KEY` y `STRIPE_SECRET_KEY` **nunca** se exponen al cliente.
- Las mutaciones del catálogo se hacen con sesión de Supabase + RLS (`public.is_admin()`).
- Los pedidos se insertan vía webhook firmado de Stripe y son idempotentes por `stripe_session_id`.