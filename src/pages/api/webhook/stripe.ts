import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { getAdminClient } from '../../../lib/supabase/admin';
import { getStripe } from '../../../lib/stripe';
import { envStripeWebhookSecret, isStripeConfigured } from '../../../lib/env';
import { parseSizeLabel } from '../../../lib/sizes';

export const prerender = false;

interface CartEntry {
  productId: string;
  size?: string;
  qty: number;
}

async function handleCompleted(session: Stripe.Checkout.Session) {
  const adminClient = getAdminClient();
  const stripe = getStripe();
  const sessionId = session.id;
  const already = await adminClient
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (already?.data) return; // idempotente

  const lineItems = (
    await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 })
  ).data;

  let cart: CartEntry[] = [];
  try {
    const raw = session.metadata?.cart;
    cart = raw ? (JSON.parse(raw) as CartEntry[]) : [];
  } catch {
    cart = [];
  }

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      stripe_session_id: sessionId,
      stripe_payment_intent:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      customer_name: session.customer_details?.name ?? null,
      customer_email: session.customer_details?.email ?? null,
      amount_total_cents: session.amount_total ?? 0,
      currency: (session.currency ?? 'mxn').toLowerCase(),
      status: 'paid',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('order-insert-error', orderError);
    return;
  }

  for (let i = 0; i < lineItems.length; i++) {
    const line = lineItems[i];
    const meta = cart[i];
    const qty = line.quantity ?? 1;
    const amount = line.amount_total ?? 0;

    await adminClient.from('order_items').insert({
      order_id: order.id,
      product_id: meta?.productId ?? null,
      product_name: line.description ?? 'Producto',
      price_cents: amount,
      size: meta?.size ?? null,
      quantity: qty,
    });

    // Descontamos stock de la talla concreta y recalculamos el total.
    if (meta?.productId) {
      const sizeCm = meta.size ? parseSizeLabel(meta.size) : null;
      if (sizeCm !== null) {
        const { data: sizeRow } = await adminClient
          .from('product_sizes')
          .select('stock')
          .eq('product_id', meta.productId)
          .eq('size_cm', sizeCm)
          .maybeSingle();
        if (sizeRow) {
          const next = Math.max(0, (Number(sizeRow.stock) || 0) - qty);
          await adminClient
            .from('product_sizes')
            .update({ stock: next })
            .eq('product_id', meta.productId)
            .eq('size_cm', sizeCm);
        }
      }
      const { data: sizeRows } = await adminClient
        .from('product_sizes')
        .select('stock')
        .eq('product_id', meta.productId);
      const total = (sizeRows ?? []).reduce(
        (acc, r) => acc + (Number(r.stock) || 0),
        0,
      );
      await adminClient
        .from('products')
        .update({ stock: total })
        .eq('id', meta.productId);
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!isStripeConfigured()) {
    return new Response(
      JSON.stringify({ received: false, error: 'Stripe webhook no configurado' }),
      { status: 200 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();
  const secret = envStripeWebhookSecret();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? '', secret);
  } catch (err) {
    console.error('webhook-signature-error', err);
    return new Response('Firma de webhook no válida', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Procesamos después de la respuesta para no bloquear el retorno a Stripe.
    handleCompleted(event.data.object as Stripe.Checkout.Session).catch((e) =>
      console.error('webhook-handler-error', e),
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};