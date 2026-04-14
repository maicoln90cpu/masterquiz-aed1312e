import { useSupportMode } from '@/contexts/SupportModeContext';
import { useCurrentUser } from './useCurrentUser';

/**
 * Returns the effective user ID for data queries.
 * In support mode, returns the target user's ID instead of the logged-in admin's.
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
