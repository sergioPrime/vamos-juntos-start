import { useState, useEffect } from "react"
import { Plus, Building2, Trash2, Edit, MoreHorizontal, Eye, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  created_at: string
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
}

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

export function CompaniesTab() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin()
  const organization = useOrganization()
  
  // Companies state
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
    is_active: true
  })

  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgLoading, setOrgLoading] = useState(true)
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

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadCompanies()
    }
    loadOrganizations()
  }, [organization])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("org_id", organization?.currentOrg?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCompanies(data || [])
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

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Erro",
          description: "Nome da empresa é obrigatório",
          variant: "destructive",
        })
        return
      }

      const companyData = {
        ...formData,
        org_id: organization?.currentOrg?.id
      }

      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", editingCompany.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso",
        })
      } else {
        const { error } = await supabase
          .from("companies")
          .insert(companyData)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Empresa criada com sucesso",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadCompanies()
    } catch (error) {
      console.error("Error saving company:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar empresa",
        variant: "destructive",
      })
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
      is_active: true
    })
    setEditingCompany(null)
  }

  const openEditDialog = (company: Company) => {
    setEditingCompany(company)
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
      is_active: company.is_active
    })
    setDialogOpen(true)
  }

  // Organizations functions
  const loadOrganizations = async () => {
    try {
      setOrgLoading(true)
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
      setOrgLoading(false)
    }
  }

  const createOrganization = async () => {
    if (!newOrgName.trim() || !user) return

    setCreating(true)
    try {
      const slug = newOrgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      const { data, error } = await supabase.rpc('create_organization_with_owner', {
        org_name: newOrgName.trim(),
        org_slug: slug
      })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Organização criada com sucesso"
      })

      setNewOrgName('')
      setIsDialogOpen(false)
      loadOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
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

  const openOrgEditDialog = (org: Organization) => {
    setEditingOrg(org)
    setEditOrgName(org.name)
    setIsEditDialogOpen(true)
  }

  const loadOrgMembers = async (orgId: string) => {
    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_organizations')
        .select('user_id, role')
        .eq('org_id', orgId)

      if (membershipsError) throw membershipsError

      const ids = Array.from(new Set((memberships || []).map((m: any) => m.user_id).filter(Boolean)))
      if (ids.length === 0) {
        setOrgMembers([])
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

      setOrgMembers(members)
    } catch (error) {
      console.error('Error loading org members:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar membros da organização',
        variant: 'destructive'
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

  if (loading || orgLoading || superAdminLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-empresas</h2>
          <p className="text-muted-foreground">
            Gerencie múltiplas empresas e organizações
          </p>
        </div>
      </div>

      <Tabs defaultValue="empresas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="organizacoes">Organizações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="empresas" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Empresas Cadastradas</h3>
                <p className="text-muted-foreground">
                  Gerencie múltiplas empresas em uma única organização
                </p>
              </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Editar Empresa" : "Nova Empresa"}
              </DialogTitle>
              <DialogDescription>
                Configure uma nova empresa para sua organização
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
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
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="empresa@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingCompany ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre empresas para organizar melhor seus dados financeiros e operacionais
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription>
                      {company.document && `CNPJ/CPF: ${company.document}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
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
                <div className="grid gap-2 text-sm">
                  {company.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-mail:</span>
                      <span>{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.city && company.state && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Localização:</span>
                      <span>{company.city}, {company.state}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criada em:</span>
                    <span>{new Date(company.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </TabsContent>

    <TabsContent value="organizacoes" className="mt-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Organizações</h3>
            <p className="text-muted-foreground">
              Gerencie organizações e seus membros
            </p>
          </div>
          {isSuperAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Organização
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="create-org-dialog-description">
                <DialogHeader>
                  <DialogTitle>Criar Nova Organização</DialogTitle>
                </DialogHeader>
                <div id="create-org-dialog-description" className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Nome da Organização</Label>
                    <Input
                      id="orgName"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Digite o nome da organização"
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
             <DialogContent className="max-w-2xl" aria-describedby="view-org-dialog-description">
               <DialogHeader>
                 <DialogTitle>Visualizar Organização</DialogTitle>
               </DialogHeader>
               <div id="view-org-dialog-description" className="space-y-4">
                <div>
                  <Label>Nome da Organização</Label>
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
            <DialogContent aria-describedby="edit-org-dialog-description">
              <DialogHeader>
                <DialogTitle>Editar Organização</DialogTitle>
              </DialogHeader>
              <div id="edit-org-dialog-description" className="space-y-4">
                <div>
                  <Label htmlFor="editOrgName">Nome da Organização</Label>
                  <Input
                    id="editOrgName"
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    placeholder="Digite o nome da organização"
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
            <DialogContent className="max-w-2xl" aria-describedby="members-org-dialog-description">
              <DialogHeader>
                <DialogTitle>Gerenciar Membros - {managingOrg?.name}</DialogTitle>
              </DialogHeader>
              <div id="members-org-dialog-description" className="space-y-4">
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
                <h3 className="mt-2 text-sm font-semibold">Nenhuma organização encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece criando sua primeira organização.
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
                        Criada em: {new Date(org.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(org)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openOrgEditDialog(org)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openMembersManagement(org)}>
                            <Users className="h-4 w-4 mr-2" />
                            Membros
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  </Tabs>
    </div>
  )
}