import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { MODULES, MODULE_INFO, ModuleKey } from '@/constants/permissions';

interface UserWithPermissions {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  permissions: Record<ModuleKey, {
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
  }>;
}

interface ModulePermissionsManagerProps {
  selectedUserId?: string;
}

export function ModulePermissionsManager({ selectedUserId }: ModulePermissionsManagerProps) {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { currentOrg } = useOrganization();
  const { isAdmin, isSuperAdmin } = useRoleCheck();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrg) {
      loadUsersWithPermissions();
    }
  }, [currentOrg]);

  const loadUsersWithPermissions = async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);

      // Get all users from the organization
      const { data: orgUsers, error: orgError } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('org_id', currentOrg.id);

      if (orgError) throw orgError;

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', orgUsers?.map(u => u.user_id) || []);

      if (profilesError) throw profilesError;

      // Get all module permissions for these users
      const { data: permissions, error: permError } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('org_id', currentOrg.id)
        .in('user_id', orgUsers?.map(u => u.user_id) || []);

      if (permError) throw permError;

      // Combine data
      const usersWithPermissions: UserWithPermissions[] = (profiles || []).map(profile => {
        const userPerms = permissions?.filter(p => p.user_id === profile.id) || [];
        
        const permissionsMap: Record<ModuleKey, any> = {} as any;
        Object.values(MODULES).forEach(moduleKey => {
          const perm = userPerms.find(p => p.module_key === moduleKey);
          permissionsMap[moduleKey] = {
            can_create: perm?.can_create || false,
            can_read: perm?.can_read || false,
            can_update: perm?.can_update || false,
            can_delete: perm?.can_delete || false,
          };
        });

        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name,
          last_name: profile.last_name,
          permissions: permissionsMap,
        };
      });

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error('Error loading users with permissions:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    userId: string,
    moduleKey: ModuleKey,
    permissionType: 'can_create' | 'can_read' | 'can_update' | 'can_delete',
    value: boolean
  ) => {
    if (!currentOrg) return;

    try {
      setUpdating(true);

      // Check if permission exists
      const { data: existing } = await supabase
        .from('module_permissions')
        .select('id')
        .eq('org_id', currentOrg.id)
        .eq('user_id', userId)
        .eq('module_key', moduleKey)
        .maybeSingle();

      if (existing) {
        // Update existing permission
        const { error } = await supabase
          .from('module_permissions')
          .update({ [permissionType]: value })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new permission
        const { error } = await supabase
          .from('module_permissions')
          .insert({
            org_id: currentOrg.id,
            user_id: userId,
            module_key: moduleKey,
            [permissionType]: value,
          });

        if (error) throw error;
      }

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            permissions: {
              ...user.permissions,
              [moduleKey]: {
                ...user.permissions[moduleKey],
                [permissionType]: value,
              },
            },
          };
        }
        return user;
      }));

      toast({
        title: 'Permissão atualizada',
        description: 'As permissões foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar permissões de módulos.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredUsers = selectedUserId 
    ? users.filter(u => u.id === selectedUserId)
    : users;

  return (
    <div className="space-y-6">
      {filteredUsers.map(user => (
        <Card key={user.id}>
          <CardHeader>
            <CardTitle>
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.email}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.values(MODULES).map(moduleKey => {
                const moduleInfo = MODULE_INFO[moduleKey];
                const perms = user.permissions[moduleKey];

                return (
                  <div key={moduleKey} className="space-y-3">
                    <h4 className="font-medium">{moduleInfo.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${user.id}-${moduleKey}-create`}
                          checked={perms.can_create}
                          onCheckedChange={(checked) =>
                            updatePermission(user.id, moduleKey, 'can_create', checked as boolean)
                          }
                          disabled={updating}
                        />
                        <Label htmlFor={`${user.id}-${moduleKey}-create`}>Criar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${user.id}-${moduleKey}-read`}
                          checked={perms.can_read}
                          onCheckedChange={(checked) =>
                            updatePermission(user.id, moduleKey, 'can_read', checked as boolean)
                          }
                          disabled={updating}
                        />
                        <Label htmlFor={`${user.id}-${moduleKey}-read`}>Visualizar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${user.id}-${moduleKey}-update`}
                          checked={perms.can_update}
                          onCheckedChange={(checked) =>
                            updatePermission(user.id, moduleKey, 'can_update', checked as boolean)
                          }
                          disabled={updating}
                        />
                        <Label htmlFor={`${user.id}-${moduleKey}-update`}>Editar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${user.id}-${moduleKey}-delete`}
                          checked={perms.can_delete}
                          onCheckedChange={(checked) =>
                            updatePermission(user.id, moduleKey, 'can_delete', checked as boolean)
                          }
                          disabled={updating}
                        />
                        <Label htmlFor={`${user.id}-${moduleKey}-delete`}>Excluir</Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
