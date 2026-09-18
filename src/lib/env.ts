export function envUrl(): string {
  const v = import.meta.env.PUBLIC_SUPABASE_URL;
  if (!v) throw new Error('Falta PUBLIC_SUPABASE_URL');
  return v;
}

export function envAnonKey(): string {
  const v = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error('Falta PUBLIC_SUPABASE_ANON_KEY');
  return v;
}

export function envServiceRoleKey(): string {
  const v = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  return v;
}

export function envStripeSecretKey(): string {
  const v = import.meta.env.STRIPE_SECRET_KEY;
  if (!v) throw new Error('Falta STRIPE_SECRET_KEY');
  return v;
}

export function envStripeWebhookSecret(): string {
  const v = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!v) throw new Error('Falta STRIPE_WEBHOOK_SECRET');
  return v;
}

export function siteUrl(): string {
  return import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
  const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    url.startsWith('https://') &&
    url.includes('supabase.co') &&
    !url.includes('dummy') &&
    !url.includes('xxxx') &&
    !anon.includes('...') &&
    anon.length > 20
  );
}

export function isStripeConfigured(): boolean {
  const key = import.meta.env.STRIPE_SECRET_KEY ?? '';
  return key.startsWith('sk_') && key.length > 20 && !key.includes('...');
}

export function isWebhookConfigured(): boolean {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? '';
  return secret.startsWith('whsec_') && secret.length > 20;
}

export function isServiceRoleConfigured(): boolean {
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return (
    key.length > 20 &&
    !key.includes('...') &&
    !key.includes('xxxx') &&
    !key.startsWith('sb_secret_placeholder')
  );
}