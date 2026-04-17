import { useSupportMode } from '@/contexts/SupportModeContext';
import { useCurrentUser } from './useCurrentUser';

/**
 * Hook que retorna o `userId` efetivo a ser usado em queries.
 *
 * Em modo suporte (admin impersonando usuário), retorna o ID do usuário-alvo
 * em vez do admin logado. Toda query de dados sensíveis em telas que suportam
 * suporte deve usar `effectiveUserId` ao invés de `user.id` direto.
 *
 * @returns `{ effectiveUserId, realUser, isSupportMode, supportTarget, session, loading }`
 *
 * @example
 * ```tsx
 * const { effectiveUserId } = useEffectiveUser();
 * const { data } = useQuery({
 *   queryKey: ['quizzes', effectiveUserId],
 *   queryFn: () => supabase.from('quizzes').select().eq('user_id', effectiveUserId),
 * });
 * ```
 *
 * @see {@link useCurrentUser} para o user real (sempre o admin logado)
 * @see SupportModeContext
 */
export const useEffectiveUser = () => {
  const { user, session, loading } = useCurrentUser();
  const { isSupportMode, target } = useSupportMode();

  return {
    /** The effective user ID to use in queries */
    effectiveUserId: isSupportMode && target ? target.userId : user?.id ?? null,
    /** The real logged-in user (always the admin) */
    realUser: user,
    /** Whether we're viewing another user's data */
    isSupportMode,
    /** Target user info when in support mode */
    supportTarget: target,
    session,
    loading,
  };
};
