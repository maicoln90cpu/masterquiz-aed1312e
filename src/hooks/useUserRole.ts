import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (authLoading) return;
      
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (data) {
          setRoles(data.map(r => r.role as AppRole));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isMasterAdmin = hasRole('master_admin');
  const isAdmin = hasRole('admin') || hasRole('master_admin');
  const isUser = roles.length > 0;

  return {
    roles,
    loading: loading || authLoading,
    hasRole,
    isMasterAdmin,
    isAdmin,
    isUser
  };
};
