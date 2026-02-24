import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mergeAttempted = useRef(false);

  const attemptMerge = async (accessToken: string) => {
    if (mergeAttempted.current) return;
    mergeAttempted.current = true;
    try {
      const { data, error } = await supabase.functions.invoke('merge-user-data', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!error && data?.merged) {
        toast.success('Seus dados anteriores foram restaurados com sucesso!');
      }
    } catch (err) {
      console.error('[MERGE] Error:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.access_token) {
          setTimeout(() => attemptMerge(session.access_token), 0);
          // Incrementar login_count no profile
          if (session.user?.id) {
            (supabase.rpc as Function)('increment_login_count', { p_user_id: session.user.id })
              .then(() => console.log('[Auth] login_count incremented'))
              .catch((err: unknown) => console.error('[Auth] Failed to increment login_count:', err));
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
