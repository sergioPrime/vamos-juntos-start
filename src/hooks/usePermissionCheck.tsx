import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionGuard } from './usePermissionGuard';
import { ModuleKey, PermissionType } from '@/constants/permissions';

/**
 * Hook simples para verificar permissão e redirecionar se não tiver acesso
 * Use este hook no início de componentes de página que precisam de permissão
 */
export function usePermissionCheck(moduleKey: ModuleKey, permission: PermissionType) {
  const { hasPermission, loading } = usePermissionGuard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !hasPermission(moduleKey, permission)) {
      navigate('/access-denied', { 
        replace: true,
        state: { moduleKey, permission }
      });
    }
  }, [loading, hasPermission, moduleKey, permission, navigate]);

  return { loading };
}
