import { useState, useEffect } from "react"
import { Plus, Building2, Trash2, Edit, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

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

export function CompaniesTab() {
  const { toast } = useToast()
  const organization = useOrganization()
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

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadCompanies()
    }
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

  if (loading) {
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
  )
}