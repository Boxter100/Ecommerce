import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase/server';
import { isSupabaseConfigured } from '../../../lib/env';
import { isSessionReason } from '../../../lib/session';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const reason = url.searchParams.get('reason');
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient({ request, cookies });
    await supabase.auth.signOut();
  }
  const location = isSessionReason(reason)
    ? `/admin/login?reason=${reason}`
    : '/admin/login';
  return new Response(null, {
    status: 303,
    headers: { Location: location },
  });
};