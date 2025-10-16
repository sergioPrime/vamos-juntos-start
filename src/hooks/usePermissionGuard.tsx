import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModulePermissions } from './useModulePermissions';
import { ModuleKey, PermissionType } from '@/constants/permissions';
import { toast } from '@/hooks/use-toast';

export function usePermissionGuard(moduleKey: ModuleKey, requiredPermission: PermissionType) {
  const { hasPermission, loading } = useModulePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for permissions to load completely
    if (loading) return;

    // Only check and redirect if we're sure the user doesn't have permission
    const hasAccess = hasPermission(moduleKey, requiredPermission);
    
    if (!hasAccess) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar este recurso.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [moduleKey, requiredPermission, hasPermission, loading, navigate]);

  return { loading, hasAccess: hasPermission(moduleKey, requiredPermission) };
}
