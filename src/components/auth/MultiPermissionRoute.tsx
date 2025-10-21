import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { ModuleKey, PermissionType } from '@/constants/permissions';
import { Shield } from 'lucide-react';

interface PermissionCheck {
  moduleKey: ModuleKey;
  permission: PermissionType;
}

interface MultiPermissionRouteProps {
  permissions: PermissionCheck[];
  operator?: 'AND' | 'OR';
  children: ReactNode;
  redirectTo?: string;
}

export function MultiPermissionRoute({ 
  permissions, 
  operator = 'AND',
  children, 
  redirectTo = '/access-denied' 
}: MultiPermissionRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasAllPermissions, hasAnyPermission, loading: permLoading } = usePermissionGuard();

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

  // Verifica permissões baseado no operador
  const hasAccess = operator === 'AND' 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace state={{ permissions, operator }} />;
  }

  return <>{children}</>;
}
