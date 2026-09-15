import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase/server';
import { isSupabaseConfigured } from '../../../lib/env';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient({ request, cookies });
    await supabase.auth.signOut();
  }
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/login' },
  });
};