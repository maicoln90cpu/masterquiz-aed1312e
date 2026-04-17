import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook leve que retorna o usuário atual a partir do `AuthContext`.
 *
 * **OBRIGATÓRIO** usar este hook em componentes ao invés de chamar
 * `supabase.auth.getUser()` diretamente — evita requests duplicados,
 * mantém estado consistente e respeita o ciclo de vida da sessão.
 *
 * @returns `{ user, session, loading }`
 *
 * @example
 * ```tsx
 * const { user, loading } = useCurrentUser();
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 * ```
 *
 * @see {@link useEffectiveUser} para suporte a impersonação admin
 */
export const useCurrentUser = () => {
  const { user, session, loading } = useAuth();
  return { user, session, loading };
};
