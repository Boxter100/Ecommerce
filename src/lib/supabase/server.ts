import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { envUrl, envAnonKey } from '../env';

export interface SupabaseContext {
  request: Request;
  cookies: Pick<AstroCookies, 'set'>;
}

export function createSupabaseClient({ request, cookies }: SupabaseContext) {
  return createServerClient(envUrl(), envAnonKey(), {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });
}