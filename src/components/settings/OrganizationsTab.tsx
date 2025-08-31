import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Eye, Edit, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

interface Member {
  id: string
  email: string | null
  role: string
}

export function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null)
  const [editOrgName, setEditOrgName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [orgMembers, setOrgMembers] = useState<Member[]>([])
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null)
  const [availableUsers, setAvailableUsers] = useState<{id: string, email: string}[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [managingMembers, setManagingMembers] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin()

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar organizações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async () => {
    if (!newOrgName.trim() || !user) return

    console.log('Creating organization...', { name: newOrgName.trim(), user: user?.id })
    setCreating(true)
    try {
      const slug = newOrgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      console.log('Calling RPC with:', { org_name: newOrgName.trim(), org_slug: slug })
      
      const { data, error } = await supabase.rpc('create_organization_with_owner', {
        org_name: newOrgName.trim(),
        org_slug: slug
      })

      console.log('RPC response:', { data, error })

      if (error) {
        console.error('RPC error details:', error)
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Organização criada com sucesso"
      })

      setNewOrgName('')
      setIsDialogOpen(false)
      loadOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      toast({
        title: "Erro",
        description: "Erro ao criar organização",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const openViewDialog = async (org: Organization) => {
    setViewingOrg(org)
    setIsViewDialogOpen(true)
    await loadOrgMembers(org.id)
  }

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org)
    setEditOrgName(org.name)
    setIsEditDialogOpen(true)
  }

  const loadOrgMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          role,
          profiles:user_id (
            email
          )
        `)
        .eq('org_id', orgId)

      if (error) throw error

      const members = data?.map((item: any) => ({
        id: item.user_id,
        email: item.profiles?.email || null,
        role: item.role
      })) || []

      setOrgMembers(members)
    } catch (error) {
      console.error('Error loading org members:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da organização",
        variant: "destructive"
      })
    }
  }

  const openMembersManagement = async (org: Organization) => {
    setManagingOrg(org)
    setIsMembersDialogOpen(true)
    await loadOrgMembers(org.id)
    await loadAvailableUsers()
  }

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .order('email')

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Error loading available users:', error)
    }
  }

  const addMemberToOrg = async () => {
    if (!selectedUserId || !managingOrg) return

    setManagingMembers(true)
    try {
      const { error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: selectedUserId,
          org_id: managingOrg.id,
          role: selectedRole
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro adicionado à organização"
      })

      setSelectedUserId('')
      setSelectedRole('member')
      await loadOrgMembers(managingOrg.id)
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro",
        variant: "destructive"
      })
    } finally {
      setManagingMembers(false)
    }
  }

  const removeMemberFromOrg = async (userId: string) => {
    if (!managingOrg) return

    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('org_id', managingOrg.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro removido da organização"
      })

      await loadOrgMembers(managingOrg.id)
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      })
    }
  }

  const updateOrganization = async () => {
    if (!editingOrg || !editOrgName.trim() || !user) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: editOrgName.trim() })
        .eq('id', editingOrg.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Organização atualizada com sucesso"
      })

      setEditOrgName('')
      setEditingOrg(null)
      setIsEditDialogOpen(false)
      loadOrganizations()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar organização",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  if (loading || superAdminLoading) {
    return <div className="text-center">Carregando organizações...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Empresas Cadastradas</h3>
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrganization} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        {/* View Organization Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Visualizar Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Empresa</Label>
                <Input
                  value={viewingOrg?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Membros Associados</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {orgMembers.length > 0 ? (
                    orgMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{member.email}</span>
                        <Badge variant="secondary">{member.role}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Organization Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Nome da Empresa</Label>
                <Input
                  id="editName"
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateOrganization} disabled={updating}>
                  {updating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Membros - {managingOrg?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add Member Section */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">Adicionar Membro</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(user => !orgMembers.some(member => member.id === user.id))
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="owner">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addMemberToOrg} disabled={!selectedUserId || managingMembers}>
                    {managingMembers ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>

              {/* Current Members */}
              <div>
                <h4 className="text-sm font-medium mb-3">Membros Atuais</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orgMembers.length > 0 ? (
                    orgMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span>{member.email}</span>
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeMemberFromOrg(member.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando sua primeira empresa.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{org.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(org)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {isSuperAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openMembersManagement(org)}>
                          <Users className="h-4 w-4 mr-1" />
                          Membros
                        </Button>
                      </>
                    )}
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}