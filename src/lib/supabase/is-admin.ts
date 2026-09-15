import type { SupabaseClient, User } from '@supabase/supabase-js';

export const ADMIN_ROLE = 'admin';
export const SUPER_ADMIN_ROLE = 'super_admin';

const ADMIN_ROLES = new Set([ADMIN_ROLE, SUPER_ADMIN_ROLE]);

async function userRole(
  supabase: SupabaseClient,
  user: User | null,
): Promise<string> {
  if (!user) return '';
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return data ? String((data as { role?: string }).role ?? '') : '';
}

export async function isAdminUser(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  return ADMIN_ROLES.has(await userRole(supabase, user));
}

export async function isSuperAdminUser(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  return (await userRole(supabase, user)) === SUPER_ADMIN_ROLE;
}