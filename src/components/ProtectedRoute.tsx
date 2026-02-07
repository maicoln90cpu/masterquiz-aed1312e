import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'master_admin' | 'admin' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { hasRole, isAdmin, isMasterAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && requiredRole) {
      // Master admin tem acesso a tudo
      if (isMasterAdmin) {
        return;
      }
      
      // Verificar acesso específico
      if (requiredRole === 'admin' && !isAdmin) {
        toast.error('Acesso negado - privilégios insuficientes');
        navigate(fallbackPath);
      } else if (requiredRole === 'master_admin' && !isMasterAdmin) {
        toast.error('Acesso negado - privilégios insuficientes');
        navigate(fallbackPath);
      } else if (!hasRole(requiredRole)) {
        toast.error('Acesso negado - privilégios insuficientes');
        navigate(fallbackPath);
      }
    }
  }, [loading, requiredRole, hasRole, isAdmin, isMasterAdmin, navigate, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requiredRole) {
    // Master admin tem acesso a tudo
    if (isMasterAdmin) {
      return <>{children}</>;
    }
    
    // Verificar acesso específico
    if (requiredRole === 'admin' && !isAdmin) {
      return null;
    }
    if (requiredRole === 'master_admin' && !isMasterAdmin) {
      return null;
    }
    if (!hasRole(requiredRole)) {
      return null;
    }
  }

  return <>{children}</>;
};
