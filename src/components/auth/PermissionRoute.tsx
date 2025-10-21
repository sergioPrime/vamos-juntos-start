import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { ModuleKey, PermissionType } from '@/constants/permissions';
import { Shield } from 'lucide-react';

interface PermissionRouteProps {
  moduleKey: ModuleKey;
  permission: PermissionType;
  children: ReactNode;
  redirectTo?: string;
}

export function PermissionRoute({ 
  moduleKey, 
  permission, 
  children, 
  redirectTo = '/access-denied' 
}: PermissionRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissionGuard();

  // Se não está autenticado, redireciona para login
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold">Verificando Permissões</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos seu acesso...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verifica permissão
  if (!hasPermission(moduleKey, permission)) {
    return <Navigate to={redirectTo} replace state={{ moduleKey, permission }} />;
  }

  return <>{children}</>;
}
