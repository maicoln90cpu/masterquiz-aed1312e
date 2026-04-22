/**
 * 🔒 PROTEÇÃO P18 — Helper de autenticação JWT para Edge Functions.
 * Centraliza extração de token + getUser + retorno de envelope 401.
 */
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { errorResponse } from './envelope.ts';

export interface AuthOk {
  user: { id: string; email?: string | null };
  supabase: SupabaseClient;
  token: string;
}

/**
 * Valida JWT. Retorna { user, supabase } em sucesso ou Response 401 em falha.
 * O cliente Supabase devolvido usa SERVICE_ROLE_KEY (bypassa RLS).
 */
export async function requireAuth(
  req: Request,
  traceId: string,
  corsHeaders: Record<string, string> = {},
): Promise<AuthOk | Response> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse('UNAUTHORIZED', 'Authorization header required', traceId, corsHeaders);
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token', traceId, corsHeaders);
  }
  return { user: { id: data.user.id, email: data.user.email }, supabase, token };
}

/** Exige role específica (ex: 'master_admin'). */
export async function requireRole(
  auth: AuthOk,
  role: string,
  traceId: string,
  corsHeaders: Record<string, string> = {},
): Promise<true | Response> {
  const { data } = await auth.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.user.id)
    .eq('role', role)
    .maybeSingle();
  if (!data) {
    return errorResponse('FORBIDDEN', `Requires role: ${role}`, traceId, corsHeaders);
  }
  return true;
}
