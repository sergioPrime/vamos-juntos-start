import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModulePermissions } from './useModulePermissions';
import { ModuleKey, PermissionType } from '@/constants/permissions';
import { toast } from '@/hooks/use-toast';

export function usePermissionGuard(moduleKey: ModuleKey, requiredPermission: PermissionType) {
  const { hasPermission, loading } = useModulePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!hasPermission(moduleKey, requiredPermission)) {
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
