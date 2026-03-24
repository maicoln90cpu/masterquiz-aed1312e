import { useAuth } from '@/contexts/AuthContext';

/**
 * Lightweight hook that returns the current user from AuthContext.
 * Use this instead of calling supabase.auth.getUser() in components.
 */
export const useCurrentUser = () => {
  const { user, session, loading } = useAuth();
  return { user, session, loading };
};
