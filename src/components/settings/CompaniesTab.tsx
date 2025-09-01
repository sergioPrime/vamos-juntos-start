import { useState, useEffect } from "react"
import { Plus, Building2, Trash2, Edit, MoreHorizontal, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from '@/hooks/useAuth'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface Company {
  id: string
  name: string
  document?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  is_active: boolean
  is_default?: boolean
  created_at: string
  org_id?: string
  updated_at?: string
  members?: Member[]
}

interface CompanyFormData {
  name: string
  document: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  is_active: boolean
  is_default: boolean
}

interface Member {
  id: string
  email: string | null
  role: string
}

export function CompaniesTab() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin()
  const organization = useOrganization()
  
  // State management
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "BR",
    is_active: true,
    is_default: false
  })

  // Members management
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [managingCompany, setManagingCompany] = useState<Company | null>(null)
  const [availableUsers, setAvailableUsers] = useState<{id: string, email: string}[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [managingMembers, setManagingMembers] = useState(false)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadCompanies()
    }
  }, [organization])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      
      // Carregar empresas existentes
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .eq("org_id", organization?.currentOrg?.id)
        .order("created_at", { ascending: false })

      if (companiesError) throw companiesError

      // Carregar organizações e converter para empresas
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Combinar dados das organizações com empresas
      const mergedCompanies = [...(companiesData || [])]
      
      // Adicionar organizações como empresas (se não existem empresas correspondentes)
      for (const org of orgsData || []) {
        const existingCompany = mergedCompanies.find(c => c.name === org.name)
        if (!existingCompany) {
          mergedCompanies.push({
            id: org.id,
            name: org.name,
            country: 'BR',
            is_active: true,
            is_default: false,
            created_at: org.created_at,
            org_id: organization?.currentOrg?.id || '',
            updated_at: org.updated_at,
            email: '',
            document: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip_code: ''
          })
        }
      }

      setCompanies(mergedCompanies)
    } catch (error) {
      console.error("Error loading companies:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!organization?.currentOrg?.id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Organização não encontrada"
        })
        return
      }

      const companyData = {
        ...formData,
        org_id: organization.currentOrg.id
      }

      // If setting as default, remove default from other companies first
      if (formData.is_default) {
        await supabase
          .from("companies")
          .update({ is_default: false })
          .eq("org_id", organization.currentOrg.id)
      }

      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", editingCompany.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso!"
        })
      } else {
        const { error } = await supabase
          .from("companies")
          .insert([companyData])

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Empresa criada com sucesso!"
        })
      }

      setDialogOpen(false)
      resetForm()
      loadCompanies()
    } catch (error) {
      console.error("Error saving company:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar empresa"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso",
      })
      loadCompanies()
    } catch (error) {
      console.error("Error deleting company:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover empresa",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (company: Company) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: !company.is_active })
        .eq("id", company.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Empresa ${!company.is_active ? "ativada" : "desativada"}`,
      })
      loadCompanies()
    } catch (error) {
      console.error("Error toggling company:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status da empresa",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      document: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "BR",
      is_active: true,
      is_default: false
    })
    setEditingCompany(null)
  }

  const openEditDialog = (company: Company) => {
    setFormData({
      name: company.name,
      document: company.document || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zip_code: company.zip_code || "",
      country: company.country,
      is_active: company.is_active,
      is_default: company.is_default || false
    })
    setEditingCompany(company)
    setDialogOpen(true)
  }

  const loadCompanyMembers = async (companyId: string) => {
    try {
      // Se for uma organização importada, usar o ID da organização
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_organizations')
        .select('user_id, role')
        .eq('org_id', companyId)

      if (membershipsError) throw membershipsError

      const ids = Array.from(new Set((memberships || []).map((m: any) => m.user_id).filter(Boolean)))
      if (ids.length === 0) {
        setManagingCompany(prev => prev ? {...prev, members: []} : null)
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', ids)

      if (profilesError) throw profilesError

      const emailById = new Map((profilesData || []).map((p: any) => [p.id, p.email]))
      const members = (memberships || []).map((m: any) => ({
        id: m.user_id,
        email: emailById.get(m.user_id) ?? null,
        role: m.role
      }))

      setManagingCompany(prev => prev ? {...prev, members} : null)
    } catch (error) {
      console.error('Error loading company members:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar membros da empresa',
        variant: 'destructive'
      })
    }
  }

  const openMembersManagement = async (company: Company) => {
    setManagingCompany(company)
    setIsMembersDialogOpen(true)
    await loadCompanyMembers(company.id)
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

  const addMemberToCompany = async () => {
    if (!selectedUserId || !managingCompany) return

    setManagingMembers(true)
    try {
      const { error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: selectedUserId,
          org_id: managingCompany.id,
          role: selectedRole
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro adicionado à empresa"
      })

      setSelectedUserId('')
      setSelectedRole('member')
      await loadCompanyMembers(managingCompany.id)
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

  const removeMemberFromCompany = async (userId: string) => {
    if (!managingCompany) return

    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('org_id', managingCompany.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro removido da empresa"
      })

      await loadCompanyMembers(managingCompany.id)
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      })
    }
  }

  if (loading || superAdminLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Empresas</h2>
          <p className="text-muted-foreground">Gerencie as empresas do sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Editar Empresa" : "Nova Empresa"}
              </DialogTitle>
              <DialogDescription>
                {editingCompany 
                  ? "Edite as informações da empresa" 
                  : "Preencha os dados da nova empresa"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ/CPF</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="empresa@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Empresa ativa</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Empresa padrão</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingCompany ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {companies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          companies.map((company) => (
            <Card key={company.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  {company.is_default && (
                    <Badge variant="default" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEditDialog(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openMembersManagement(company)}>
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Membros
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(company)}>
                        <Switch className="h-4 w-4 mr-2" />
                        {company.is_active ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(company.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {company.document && (
                    <div>
                      <span className="text-muted-foreground">CNPJ/CPF:</span>
                      <p>{company.document}</p>
                    </div>
                  )}
                  {company.email && (
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <p>{company.email}</p>
                    </div>
                  )}
                  {company.phone && (
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p>{company.phone}</p>
                    </div>
                  )}
                  {company.city && (
                    <div>
                      <span className="text-muted-foreground">Cidade:</span>
                      <p>{company.city}/{company.state}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Membros - {managingCompany?.name}</DialogTitle>
            <DialogDescription>
              Adicione ou remova membros desta empresa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add Member Section */}
            {isSuperAdmin && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Adicionar Membro</h4>
                <div className="flex gap-4">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(user => !managingCompany?.members?.some(m => m.id === user.id))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={addMemberToCompany}
                    disabled={!selectedUserId || managingMembers}
                  >
                    {managingMembers ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Membros Atuais</h4>
              </div>
              <div className="divide-y">
                {managingCompany?.members?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum membro encontrado
                  </div>
                ) : (
                  managingCompany?.members?.map((member) => (
                    <div key={member.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{member.email || 'Email não disponível'}</p>
                        <Badge variant="outline" className="mt-1">
                          {member.role}
                        </Badge>
                      </div>
                      {isSuperAdmin && member.role !== 'owner' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMemberFromCompany(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}