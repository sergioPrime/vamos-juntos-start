import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModulePermissionsManager } from './ModulePermissionsManager';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export function UserPermissionsMatrix() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    loadUsers();
  }, [currentOrg]);

  const loadUsers = async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);

      const { data: orgUsers, error: orgError } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('org_id', currentOrg.id);

      if (orgError) throw orgError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', orgUsers?.map(u => u.user_id) || []);

      if (profilesError) throw profilesError;

      setUsers(profiles || []);
      
      if (profiles && profiles.length > 0) {
        setSelectedUserId(profiles[0].id);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permissões por Módulo</CardTitle>
          <CardDescription>
            Gerencie permissões granulares de acesso aos módulos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o usuário</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name} (${user.email})`
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && <ModulePermissionsManager selectedUserId={selectedUserId} />}
    </div>
  );
}
