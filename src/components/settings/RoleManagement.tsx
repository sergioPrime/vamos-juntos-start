import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Shield, UserCog, Crown } from 'lucide-react'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface UserWithRole {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  roles: string[]
}

export function RoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { isSuperAdmin } = useSuperAdmin()

  const loadUsersWithRoles = async () => {
    try {
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .order('email')

      if (profilesError) throw profilesError

      // Buscar roles de cada usuário
      const usersWithRoles: UserWithRole[] = []
      
      for (const profile of profiles || []) {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)

        if (rolesError) throw rolesError

        usersWithRoles.push({
          ...profile,
          roles: userRoles?.map(r => r.role) || []
        })
      }

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários com permissões",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Remover todas as roles atuais
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      // Adicionar nova role (exceto 'user' que é o padrão)
      if (newRole !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: newRole as 'admin' | 'superadmin' | 'user'
          }])

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso"
      })

      await loadUsersWithRoles()
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadUsersWithRoles()
  }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="w-4 h-4" />
      case 'admin':
        return <UserCog className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'superadmin':
        return 'destructive'
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getCurrentRole = (roles: string[]): string => {
    if (roles.includes('superadmin')) return 'superadmin'
    if (roles.includes('admin')) return 'admin'
    return 'user'
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Apenas superadministradores podem gerenciar permissões globais
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Permissões Globais</CardTitle>
        <CardDescription>
          Gerencie as permissões de acesso dos usuários no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.first_name && (
                    <span className="text-sm text-muted-foreground">
                      ({user.first_name} {user.last_name})
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getRoleVariant(getCurrentRole(user.roles))} className="gap-1">
                    {getRoleIcon(getCurrentRole(user.roles))}
                    {getCurrentRole(user.roles) === 'superadmin' && 'Superadministrador'}
                    {getCurrentRole(user.roles) === 'admin' && 'Administrador'}
                    {getCurrentRole(user.roles) === 'user' && 'Usuário'}
                  </Badge>
                </div>
              </div>

              <div className="w-48">
                <Select
                  value={getCurrentRole(user.roles)}
                  onValueChange={(value) => updateUserRole(user.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Usuário
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="superadmin">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Superadministrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Níveis de Permissão:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <strong>Usuário:</strong> Acesso básico ao sistema, pode gerenciar dados da sua organização
              </div>
            </li>
            <li className="flex items-start gap-2">
              <UserCog className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <strong>Administrador:</strong> Acesso administrativo, pode gerenciar usuários e configurações
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="w-4 h-4 mt-0.5 text-destructive" />
              <div>
                <strong>Superadministrador:</strong> Acesso completo, pode gerenciar planos, organizações e permissões globais
              </div>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
