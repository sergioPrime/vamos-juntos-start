import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Search, UserCog, Shield, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function AdminUsersPanel() {
  const { users, loading, totalUsers, activeUsers, suspendedUsers, refreshUsers, updateUserRole, toggleUserStatus } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.org_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.subscription_status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Ativa' },
      inactive: { variant: 'secondary', label: 'Inativa' },
      suspended: { variant: 'destructive', label: 'Suspensa' },
      expired: { variant: 'destructive', label: 'Expirada' },
      trial: { variant: 'outline', label: 'Trial' }
    };

    const config = variants[status] || variants.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="h-3 w-3" />
          Super Admin
        </Badge>
      );
    }

    const roleLabels: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Admin',
      manager: 'Gerente',
      member: 'Membro'
    };

    return <Badge variant="outline">{roleLabels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspensas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{suspendedUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie todos os usuários do sistema</CardDescription>
            </div>
            <Button onClick={refreshUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou organização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Roles</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="member">Membro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="suspended">Suspensa</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando usuários...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.first_name} {user.last_name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.org_name}</span>
                            <span className="text-xs text-muted-foreground">{user.org_slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role, user.is_super_admin)}</TableCell>
                        <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setNewRole(user.role);
                                  }}
                                  disabled={user.is_super_admin}
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Alterar Role do Usuário</DialogTitle>
                                  <DialogDescription>
                                    Altere a role de {user.first_name} {user.last_name} na organização {user.org_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Nova Role</Label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="owner">Proprietário</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="member">Membro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      updateUserRole(user.id, user.org_id, newRole);
                                    }}
                                    className="w-full"
                                  >
                                    Salvar Alteração
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant={user.subscription_status === 'suspended' ? 'default' : 'destructive'}
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.subscription_status === 'active')}
                              disabled={user.is_super_admin}
                            >
                              {user.subscription_status === 'suspended' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
