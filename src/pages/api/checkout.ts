import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../lib/supabase/server';
import { getStripe } from '../../lib/stripe';
import { isStripeConfigured, siteUrl, isSupabaseConfigured } from '../../lib/env';
import { sizeLabel } from '../../lib/sizes';
import { demoProducts } from '../../data/demo';

export const prerender = false;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

interface CheckoutLine {
  productId: string;
  size: string;
  qty: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!isStripeConfigured()) {
      return json(
        {
          error:
            'Stripe aún no está conectado. Añade STRIPE_SECRET_KEY a tu archivo .env para activar los pagos.',
          code: 'stripe_not_configured',
        },
        503,
      );
    }

    const raw = await request.json().catch(() => null);
    if (!raw || !Array.isArray(raw.items) || raw.items.length === 0) {
      return json({ error: 'El carrito está vacío' }, 400);
    }

    const items = raw.items as CheckoutLine[];
    const supabase = isSupabaseConfigured()
      ? createSupabaseClient({ request, cookies })
      : null;

    // Reconstruimos la orden en el servidor con datos autoritativos de la BD.
    const resolved: { item: CheckoutLine; data: { id: string; name: string; price_cents: number; stock: number; images: string[] | null }; stockBySize: Record<string, number> | null }[] = [];
    for (const item of items) {
      const demo = demoProducts.find((p) => p.id === item.productId && p.active);
      let data: (typeof resolved)[number]['data'] | null = null;
      let stockBySize: Record<string, number> | null = null;

      if (supabase && !demo) {
        const { data: db, error } = await supabase
          .from('products')
          .select('id, name, price_cents, stock, images')
          .eq('id', item.productId)
          .eq('active', true)
          .maybeSingle();
        if (!error && db) {
          data = db as (typeof resolved)[number]['data'];
          const { data: sizeRows } = await supabase
            .from('product_sizes')
            .select('size_cm, stock')
            .eq('product_id', item.productId);
          stockBySize = {};
          for (const r of sizeRows ?? []) {
            stockBySize[sizeLabel(Number(r.size_cm))] = Number(r.stock) || 0;
          }
        }
      } else if (demo) {
        data = {
          id: demo.id,
          name: demo.name,
          price_cents: demo.price_cents,
          stock: demo.stock,
          images: demo.images,
        };
        stockBySize = demo.stockBySize ?? null;
      }

      if (!data) {
        return json({ error: 'Hay productos que ya no están disponibles' }, 400);
      }
      if (!Number.isInteger(item.qty) || item.qty < 1) {
        return json({ error: `Cantidad inválida para ${data.name}` }, 400);
      }
      const avail = item.size && stockBySize
        ? stockBySize[item.size] ?? 0
        : data.stock;
      if (item.qty > avail) {
        return json(
          { error: `Stock insuficiente para ${data.name}${item.size ? ` (talla ${item.size})` : ''}` },
          409,
        );
      }
      resolved.push({ item, data, stockBySize });
    }

    const endpoint = siteUrl();
    const absoluteImages = endpoint.startsWith('https://');

    const line_items = resolved.map(({ item, data }) => ({
      quantity: item.qty,
      price_data: {
        currency: 'mxn',
        unit_amount: data.price_cents,
        product_data: {
          name: data.name,
          ...(item.size ? { description: `Talla ${item.size}` } : {}),
          ...(absoluteImages && data.images?.length
            ? { images: [new URL(data.images[0], endpoint).toString()] }
            : {}),
        },
      },
    }));

    const metaEntries = resolved.map(({ item }) => ({
      productId: item.productId,
      size: item.size ?? '',
      qty: item.qty,
    }));
    const metaCart = JSON.stringify(metaEntries);
    const metadata: Record<string, string> = {
      app: 'vuelta',
      // El límite de metadata de Stripe es 500 chars por clave.
      cart: metaCart.length <= 480 ? metaCart : JSON.stringify(metaEntries.map((m) => ({ productId: m.productId, qty: m.qty }))),
    };

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items,
      metadata,
      success_url: `${endpoint}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${endpoint}/checkout/cancelado`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) {
      return json({ error: 'No se pudo iniciar la sesión de pago' }, 500);
    }
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout-error', e);
    return json({ error: (e as Error).message ?? 'Error interno' }, 500);
  }
};