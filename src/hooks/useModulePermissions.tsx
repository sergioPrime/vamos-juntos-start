import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { ModuleKey, PermissionType, ModulePermission } from '@/constants/permissions';

export function useModulePermissions() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useRoleCheck();

  useEffect(() => {
    loadPermissions();
  }, [user, currentOrg]);

  const loadPermissions = async () => {
    if (!user || !currentOrg) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', currentOrg.id);

      if (error) throw error;
      setPermissions((data || []) as ModulePermission[]);
    } catch (error) {
      console.error('Error loading module permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (moduleKey: ModuleKey, permissionType: PermissionType): boolean => {
    // Admins and superadmins have all permissions - check immediately
    if (isAdmin || isSuperAdmin) {
      return true;
    }

    const permission = permissions.find(p => p.module_key === moduleKey);
    if (!permission) return false;

    switch (permissionType) {
      case 'create':
        return permission.can_create;
      case 'read':
        return permission.can_read;
      case 'update':
        return permission.can_update;
      case 'delete':
        return permission.can_delete;
      default:
        return false;
    }
  };

  const canCreate = (moduleKey: ModuleKey) => hasPermission(moduleKey, 'create');
  const canRead = (moduleKey: ModuleKey) => hasPermission(moduleKey, 'read');
  const canUpdate = (moduleKey: ModuleKey) => hasPermission(moduleKey, 'update');
  const canDelete = (moduleKey: ModuleKey) => hasPermission(moduleKey, 'delete');

  return {
    permissions,
    loading: loading || roleLoading,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    refresh: loadPermissions,
  };
}
