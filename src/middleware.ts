import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookieSetOptions } from 'astro';
import { envUrl, envAnonKey, isSupabaseConfigured } from './lib/env';
import { MAX_SESSION_LIFETIME_MS } from './lib/session';

export const onRequest = defineMiddleware(async (context, next) => {
  let supabase = null;
  let user = null;

  if (isSupabaseConfigured()) {
    supabase = createServerClient(envUrl(), envAnonKey(), {
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options as AstroCookieSetOptions);
          });
        },
      },
    });
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  }

  context.locals.supabase = supabase;
  context.locals.user = user;

  const { pathname } = new URL(context.request.url);
  const isAdminArea = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminArea && !isLoginPage && !user) {
    return context.redirect(
      `/admin/login?next=${encodeURIComponent(pathname)}`,
    );
  }

  if (isAdminArea && !isLoginPage && user && supabase) {
    const lastSignIn = user.last_sign_in_at
      ? new Date(user.last_sign_in_at).getTime()
      : null;
    if (
      lastSignIn !== null &&
      Date.now() - lastSignIn > MAX_SESSION_LIFETIME_MS
    ) {
      await supabase.auth.signOut();
      return context.redirect('/admin/login?reason=max');
    }
  }

  return next();
});