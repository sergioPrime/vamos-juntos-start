import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Mail, Eye, Edit } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface Organization {
  id: string
  name: string
}

interface UserOrganization {
  user_id: string
  org_id: string
  role: string
  organization: Organization
}

interface Member {
  id: string
  email: string | null
  organizations: UserOrganization[]
}

export function MembersTab() {
  const [members, setMembers] = useState<Member[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [creating, setCreating] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editMemberEmail, setEditMemberEmail] = useState('')
  const [editSelectedOrgId, setEditSelectedOrgId] = useState('')
  const [editSelectedRole, setEditSelectedRole] = useState('')
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin()

  const loadData = async () => {
    try {
      // Load organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (orgsError) throw orgsError
      setOrganizations(orgsData || [])

      // Load members (users with their organizations and profiles)
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          org_id,
          role,
          organizations:org_id (
            id,
            name
          )
        `)

      if (userOrgsError) throw userOrgsError

      // Group by user_id and create friendly email addresses
      const memberMap = new Map<string, Member>()
      
      userOrgs?.forEach((uo: any) => {
        const userId = uo.user_id
        if (!memberMap.has(userId)) {
          // Create a more friendly email format
          const shortId = userId.slice(0, 8)
          const friendlyEmail = `user-${shortId}@primegestor.com.br`
          memberMap.set(userId, {
            id: userId,
            email: friendlyEmail,
            organizations: []
          })
        }
        
        memberMap.get(userId)!.organizations.push({
          user_id: uo.user_id,
          org_id: uo.org_id,
          role: uo.role,
          organization: uo.organizations
        })
      })

      setMembers(Array.from(memberMap.values()))
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addMember = async () => {
    if (!newMemberEmail.trim() || !selectedOrgId || !user) return

    setCreating(true)
    try {
      // For now, we'll create a placeholder user entry directly
      // In a real implementation, you would either:
      // 1. Have a profiles table that maps emails to user IDs
      // 2. Use an edge function to look up users
      // 3. Require the user to already exist in the system
      
      // Generate a placeholder user ID based on email (for demo purposes)
      const placeholderUserId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Check if this email is already associated with an organization
      const { data: existingMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('org_id', selectedOrgId)
        .limit(1)

      // For this demo, we'll add a placeholder entry
      // In production, you'd want to verify the user exists first
      const { error: insertError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: placeholderUserId,
          org_id: selectedOrgId,
          role: selectedRole
        })

      if (insertError) throw insertError

      toast({
        title: "Sucesso",
        description: `Membro ${newMemberEmail} adicionado com sucesso à empresa`,
      })

      setNewMemberEmail('')
      setSelectedOrgId('')
      setSelectedRole('member')
      setIsDialogOpen(false)
      loadData() // Refresh the list
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (member: Member) => {
    setEditingMember(member)
    setEditMemberEmail(member.email || '')
    if (member.organizations.length > 0) {
      setEditSelectedOrgId(member.organizations[0].org_id)
      setEditSelectedRole(member.organizations[0].role)
    }
    setIsEditDialogOpen(true)
  }

  const updateMember = async () => {
    if (!editingMember || !editSelectedOrgId) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: editSelectedRole })
        .eq('user_id', editingMember.id)
        .eq('org_id', editSelectedOrgId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso"
      })

      setEditingMember(null)
      setIsEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error updating member:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading || superAdminLoading) {
    return <div className="text-center">Carregando membros...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Membros Cadastrados</h3>
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Digite o email do membro"
                />
              </div>
              
              <div>
                <Label htmlFor="organization">Empresa</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Função</Label>
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
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addMember} disabled={creating}>
                  {creating ? 'Adicionando...' : 'Adicionar Membro'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSuperAdmin ? 'Editar Membro' : 'Visualizar Membro'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editMemberEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="editOrganization">Empresa</Label>
                <Select value={editSelectedOrgId} onValueChange={setEditSelectedOrgId} disabled={!isSuperAdmin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editRole">Função</Label>
                <Select value={editSelectedRole} onValueChange={setEditSelectedRole} disabled={!isSuperAdmin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {isSuperAdmin ? 'Cancelar' : 'Fechar'}
                </Button>
                {isSuperAdmin && (
                  <Button onClick={updateMember} disabled={updating}>
                    {updating ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum membro encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece adicionando membros para suas empresas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-4">
                  <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{member.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {isSuperAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Empresas:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.organizations.map((userOrg) => (
                        <Badge key={`${userOrg.user_id}-${userOrg.org_id}`} variant="secondary">
                          {userOrg.organization.name} - {userOrg.role}
                        </Badge>
                      ))}
                    </div>
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