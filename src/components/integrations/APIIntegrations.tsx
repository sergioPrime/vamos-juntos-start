import { useState, useEffect } from "react"
import { Plus, Settings, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

interface APIIntegration {
  id: string
  integration_name: string
  integration_type: string
  api_url?: string
  is_active: boolean
  last_sync_at?: string
  sync_frequency: number
  created_at: string
}

interface IntegrationFormData {
  integration_name: string
  integration_type: string
  api_url: string
  api_key: string
  sync_frequency: number
  is_active: boolean
}

const integrationTypes = [
  { value: "accounting", label: "Contabilidade", description: "Sincronização com sistemas contábeis" },
  { value: "banking", label: "Bancário", description: "Conexão com APIs bancárias" },
  { value: "payment", label: "Pagamentos", description: "Processadores de pagamento" },
  { value: "erp", label: "ERP", description: "Sistemas de gestão empresarial" },
  { value: "crm", label: "CRM", description: "Gestão de relacionamento com clientes" }
]

export function APIIntegrations() {
  const { toast } = useToast()
  const organization = useOrganization()
  const [integrations, setIntegrations] = useState<APIIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<APIIntegration | null>(null)
  const [formData, setFormData] = useState<IntegrationFormData>({
    integration_name: "",
    integration_type: "",
    api_url: "",
    api_key: "",
    sync_frequency: 24,
    is_active: true
  })

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadIntegrations()
    }
  }, [organization])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("api_integrations")
        .select("*")
        .eq("org_id", organization?.currentOrg?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error("Error loading integrations:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar integrações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.integration_name || !formData.integration_type) {
        toast({
          title: "Erro",
          description: "Preencha os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      const integrationData = {
        integration_name: formData.integration_name,
        integration_type: formData.integration_type,
        api_url: formData.api_url || null,
        api_key_encrypted: formData.api_key || null, // In real app, this should be encrypted
        sync_frequency: formData.sync_frequency,
        is_active: formData.is_active,
        org_id: organization?.currentOrg?.id
      }

      if (editingIntegration) {
        const { error } = await supabase
          .from("api_integrations")
          .update(integrationData)
          .eq("id", editingIntegration.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Integração atualizada com sucesso",
        })
      } else {
        const { error } = await supabase
          .from("api_integrations")
          .insert(integrationData)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Integração criada com sucesso",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadIntegrations()
    } catch (error) {
      console.error("Error saving integration:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar integração",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("api_integrations")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Integração removida com sucesso",
      })
      loadIntegrations()
    } catch (error) {
      console.error("Error deleting integration:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover integração",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (integration: APIIntegration) => {
    try {
      const { error } = await supabase
        .from("api_integrations")
        .update({ is_active: !integration.is_active })
        .eq("id", integration.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Integração ${!integration.is_active ? "ativada" : "desativada"}`,
      })
      loadIntegrations()
    } catch (error) {
      console.error("Error toggling integration:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status da integração",
        variant: "destructive",
      })
    }
  }

  const handleSync = async (integration: APIIntegration) => {
    try {
      const { error } = await supabase
        .from("api_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Sincronização iniciada",
      })
      loadIntegrations()
    } catch (error) {
      console.error("Error syncing integration:", error)
      toast({
        title: "Erro",
        description: "Erro ao sincronizar",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      integration_name: "",
      integration_type: "",
      api_url: "",
      api_key: "",
      sync_frequency: 24,
      is_active: true
    })
    setEditingIntegration(null)
  }

  const openEditDialog = (integration: APIIntegration) => {
    setEditingIntegration(integration)
    setFormData({
      integration_name: integration.integration_name,
      integration_type: integration.integration_type,
      api_url: integration.api_url || "",
      api_key: "", // Don't show encrypted key
      sync_frequency: integration.sync_frequency,
      is_active: integration.is_active
    })
    setDialogOpen(true)
  }

  const getIntegrationTypeLabel = (type: string) => {
    return integrationTypes.find(t => t.value === type)?.label || type
  }

  const getStatusIcon = (integration: APIIntegration) => {
    if (!integration.is_active) {
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
    return <CheckCircle className="h-4 w-4 text-primary" />
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
          <h2 className="text-2xl font-bold">Integrações API</h2>
          <p className="text-muted-foreground">
            Configure integrações com sistemas externos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? "Editar Integração" : "Nova Integração"}
              </DialogTitle>
              <DialogDescription>
                Configure uma nova integração com sistema externo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="integration_name">Nome da Integração</Label>
                <Input
                  id="integration_name"
                  value={formData.integration_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, integration_name: e.target.value }))}
                  placeholder="Ex: Contabilidade XYZ"
                />
              </div>
              <div>
                <Label htmlFor="integration_type">Tipo</Label>
                <Select
                  value={formData.integration_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, integration_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="api_url">URL da API</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                  placeholder="https://api.exemplo.com/v1"
                />
              </div>
              <div>
                <Label htmlFor="api_key">Chave da API</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Sua chave de API"
                />
              </div>
              <div>
                <Label htmlFor="sync_frequency">Frequência de Sincronização (horas)</Label>
                <Input
                  id="sync_frequency"
                  type="number"
                  value={formData.sync_frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, sync_frequency: parseInt(e.target.value) || 24 }))}
                  min="1"
                  max="168"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingIntegration ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Configure integrações para conectar com sistemas externos e automatizar processos
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Primeira Integração
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(integration)}
                  <div>
                    <CardTitle className="text-lg">{integration.integration_name}</CardTitle>
                    <CardDescription>
                      {getIntegrationTypeLabel(integration.integration_type)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={integration.is_active ? "default" : "secondary"}>
                    {integration.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration)}
                      disabled={!integration.is_active}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(integration)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(integration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  {integration.api_url && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="font-mono text-xs">{integration.api_url}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sincronização:</span>
                    <span>A cada {integration.sync_frequency}h</span>
                  </div>
                  {integration.last_sync_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última sincronização:</span>
                      <span>{new Date(integration.last_sync_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={() => handleToggleActive(integration)}
                      />
                      <span className="text-xs">
                        {integration.is_active ? "Ativa" : "Inativa"}
                      </span>
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