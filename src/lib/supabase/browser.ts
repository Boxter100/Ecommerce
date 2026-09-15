import { createBrowserClient } from '@supabase/ssr';
import { envUrl, envAnonKey } from '../env';

export function createBrowserSupabase() {
  return createBrowserClient(envUrl(), envAnonKey());
}