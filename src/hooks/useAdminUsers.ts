import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  role: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  subscription_plan_id: string | null;
  subscription_status: string;
  subscription_end: string | null;
  is_super_admin: boolean;
}

interface UseAdminUsersReturn {
  users: UserWithDetails[];
  loading: boolean;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  refreshUsers: () => Promise<void>;
  updateUserRole: (userId: string, orgId: string, newRole: string) => Promise<void>;
  toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles with their organizations and roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user organizations and roles
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('user_id, org_id, role, organizations(name, slug, subscription_plan_id, subscription_status, subscription_end)');

      if (userOrgsError) throw userOrgsError;

      // Combine data
      const usersWithDetails: UserWithDetails[] = profiles.map(profile => {
        const userOrg = userOrgs.find(uo => uo.user_id === profile.id);
        const org = userOrg?.organizations as any;

        return {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: profile.created_at,
          role: userOrg?.role || 'member',
          org_id: userOrg?.org_id || '',
          org_name: org?.name || 'Sem Organização',
          org_slug: org?.slug || '',
          subscription_plan_id: org?.subscription_plan_id || null,
          subscription_status: org?.subscription_status || 'inactive',
          subscription_end: org?.subscription_end || null,
          is_super_admin: profile.is_super_admin || false
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, orgId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('org_id', orgId);

      if (error) throw error;

      toast.success('Role atualizada com sucesso');
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role do usuário');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(currentStatus ? 'Usuário suspenso' : 'Usuário ativado');
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const activeUsers = users.filter(u => u.subscription_status === 'active').length;
  const suspendedUsers = users.filter(u => u.subscription_status === 'suspended').length;

  return {
    users,
    loading,
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    refreshUsers: fetchUsers,
    updateUserRole,
    toggleUserStatus
  };
}
