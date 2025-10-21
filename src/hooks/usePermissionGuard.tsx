import { useModulePermissions } from './useModulePermissions';
import { ModuleKey, PermissionType, ModulePermission } from '@/constants/permissions';
import { useMemo, useCallback } from 'react';

interface PermissionCheck {
  moduleKey: ModuleKey;
  permission: PermissionType;
}

export function usePermissionGuard() {
  const { hasPermission: baseHasPermission, loading, permissions } = useModulePermissions();

  // Verifica se tem uma permissão específica
  const hasPermission = useCallback(
    (moduleKey: ModuleKey, permission: PermissionType): boolean => {
      return baseHasPermission(moduleKey, permission);
    },
    [baseHasPermission]
  );

  // Verifica se tem TODAS as permissões (AND)
  const hasAllPermissions = useCallback(
    (checks: PermissionCheck[]): boolean => {
      return checks.every(check => hasPermission(check.moduleKey, check.permission));
    },
    [hasPermission]
  );

  // Verifica se tem ALGUMA das permissões (OR)
  const hasAnyPermission = useCallback(
    (checks: PermissionCheck[]): boolean => {
      return checks.some(check => hasPermission(check.moduleKey, check.permission));
    },
    [hasPermission]
  );

  // Verifica se tem acesso ao módulo (pelo menos read)
  const hasModuleAccess = useCallback(
    (moduleKey: ModuleKey): boolean => {
      return hasPermission(moduleKey, 'read');
    },
    [hasPermission]
  );

  // Retorna todas as permissões do módulo
  const getModulePermissions = useCallback(
    (moduleKey: ModuleKey) => {
      return {
        canCreate: hasPermission(moduleKey, 'create'),
        canRead: hasPermission(moduleKey, 'read'),
        canUpdate: hasPermission(moduleKey, 'update'),
        canDelete: hasPermission(moduleKey, 'delete'),
      };
    },
    [hasPermission]
  );

  // Verifica se pode realizar uma ação específica
  const canPerformAction = useCallback(
    (moduleKey: ModuleKey, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
      return hasPermission(moduleKey, action);
    },
    [hasPermission]
  );

  // Lista de módulos que o usuário tem acesso
  const accessibleModules = useMemo(() => {
    if (!permissions) return [];
    return Array.from(new Set(permissions.map(p => p.module_key)));
  }, [permissions]);

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasModuleAccess,
    getModulePermissions,
    canPerformAction,
    accessibleModules,
    userPermissions: permissions,
    loading,
  };
}
