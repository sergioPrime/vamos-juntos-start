import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { ModuleKey } from '@/constants/permissions';
import { Shield } from 'lucide-react';

interface ModuleAccessGuardProps {
  moduleKey: ModuleKey;
  children: ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

export function ModuleAccessGuard({ 
  moduleKey, 
  children, 
  redirectTo = '/access-denied',
  showMessage = false 
}: ModuleAccessGuardProps) {
  const { hasModuleAccess, loading } = usePermissionGuard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold">Verificando Acesso</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos suas permissões...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasModuleAccess(moduleKey)) {
    if (showMessage) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <Shield className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-semibold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar este módulo.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
