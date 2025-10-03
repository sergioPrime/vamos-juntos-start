import { ReactNode } from 'react';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { ModuleKey, PermissionType } from '@/constants/permissions';

interface PermissionGateProps {
  moduleKey: ModuleKey;
  permission: PermissionType;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ moduleKey, permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, loading } = useModulePermissions();

  if (loading) {
    return null;
  }

  if (!hasPermission(moduleKey, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
