import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trackOperation } from '@/lib/performanceCapture';
import type { Profile } from '@/types';

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await trackOperation('profile_fetch', 'query', async () =>
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        );

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        setProfile(data || null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
        .select()
        .single();

      if (error) return { error };
      
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { error, data: null };
    }
  };

  return {
    profile,
    loading: loading || authLoading,
    updateProfile,
  };
};
