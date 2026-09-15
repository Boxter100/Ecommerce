import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { envUrl, envServiceRoleKey } from '../env';

let _admin: SupabaseClient | null = null;

/**
 * Server-only client that bypasses RLS. Never import this module from
 * client-rendered code (islands / browser bundles). Lazy singleton para
 * no exigir la clave de servicio en el módulo (build / serverless).
 */
export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(envUrl(), envServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _admin;
}