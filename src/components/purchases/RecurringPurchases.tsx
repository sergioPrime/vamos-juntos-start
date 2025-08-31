import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { Plus, Calendar, Play, Pause, Settings, Trash2, Clock } from 'lucide-react'

interface RecurringTemplate {
  id: string
  template_name: string
  description?: string
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  frequency_interval: number
  cost_center?: string
  project_code?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  next_execution_date?: string
  last_executed_date?: string
  auto_submit: boolean
  created_at: string
  items?: RecurringTemplateItem[]
}

interface RecurringTemplateItem {
  id: string
  product_name: string
  description?: string
  quantity: number
  unit: string
  estimated_unit_price: number
  supplier_suggestion?: string
  justification?: string
}

interface NewTemplateForm {
  template_name: string
  description: string
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  frequency_interval: number
  cost_center: string
  project_code: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  auto_submit: boolean
  next_execution_date: string
  items: Omit<RecurringTemplateItem, 'id'>[]
}

const RecurringPurchases = () => {
  const { user } = useAuth()
  const { currentOrg: currentOrganization } = useOrganization()
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<NewTemplateForm>({
    template_name: '',
    description: '',
    frequency_type: 'monthly',
    frequency_interval: 1,
    cost_center: '',
    project_code: '',
    priority: 'medium',
    auto_submit: false,
    next_execution_date: '',
    items: []
  })

  useEffect(() => {
    if (currentOrganization) {
      fetchTemplates()
    }
  }, [currentOrganization])

  const fetchTemplates = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recurring_purchase_templates')
        .select(`
          *,
          recurring_purchase_template_items(*)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recurring templates:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar templates de compra recorrente",
          variant: "destructive",
        })
        return
      }

      setTemplates((data as RecurringTemplate[]) || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    if (!currentOrganization || !user) return

    try {
      const templateData = {
        template_name: newTemplate.template_name,
        description: newTemplate.description,
        frequency_type: newTemplate.frequency_type,
        frequency_interval: newTemplate.frequency_interval,
        cost_center: newTemplate.cost_center || null,
        project_code: newTemplate.project_code || null,
        priority: newTemplate.priority,
        auto_submit: newTemplate.auto_submit,
        next_execution_date: newTemplate.next_execution_date || null,
        org_id: currentOrganization.id,
        created_by: user.id
      }

      const { data: template, error: templateError } = await supabase
        .from('recurring_purchase_templates')
        .insert(templateData)
        .select()
        .single()

      if (templateError) {
        console.error('Error creating template:', templateError)
        toast({
          title: "Erro",
          description: "Erro ao criar template recorrente",
          variant: "destructive",
        })
        return
      }

      // Create items
      if (newTemplate.items.length > 0) {
        const itemsData = newTemplate.items.map(item => ({
          template_id: template.id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          estimated_unit_price: item.estimated_unit_price,
          supplier_suggestion: item.supplier_suggestion,
          justification: item.justification
        }))

        const { error: itemsError } = await supabase
          .from('recurring_purchase_template_items')
          .insert(itemsData)

        if (itemsError) {
          console.error('Error creating template items:', itemsError)
          toast({
            title: "Erro",
            description: "Erro ao criar itens do template",
            variant: "destructive",
          })
          return
        }
      }

      toast({
        title: "Sucesso",
        description: "Template de compra recorrente criado com sucesso",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchTemplates()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar template",
        variant: "destructive",
      })
    }
  }

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_purchase_templates')
        .update({ is_active: !isActive })
        .eq('id', templateId)

      if (error) {
        console.error('Error updating template status:', error)
        toast({
          title: "Erro",
          description: "Erro ao atualizar status do template",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Template ${!isActive ? 'ativado' : 'desativado'} com sucesso`,
      })

      fetchTemplates()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar template",
        variant: "destructive",
      })
    }
  }

  const addItem = () => {
    setNewTemplate(prev => ({
      ...prev,
      items: [...prev.items, {
        product_name: '',
        description: '',
        quantity: 1,
        unit: 'un',
        estimated_unit_price: 0,
        supplier_suggestion: '',
        justification: ''
      }]
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeItem = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setNewTemplate({
      template_name: '',
      description: '',
      frequency_type: 'monthly',
      frequency_interval: 1,
      cost_center: '',
      project_code: '',
      priority: 'medium',
      auto_submit: false,
      next_execution_date: '',
      items: []
    })
  }

  const getFrequencyText = (template: RecurringTemplate) => {
    const interval = template.frequency_interval
    const type = template.frequency_type
    
    if (interval === 1) {
      const translations = {
        daily: 'Diariamente',
        weekly: 'Semanalmente',
        monthly: 'Mensalmente',
        quarterly: 'Trimestralmente',
        yearly: 'Anualmente'
      }
      return translations[type]
    }
    
    const translations = {
      daily: `A cada ${interval} dias`,
      weekly: `A cada ${interval} semanas`,
      monthly: `A cada ${interval} meses`,
      quarterly: `A cada ${interval} trimestres`,
      yearly: `A cada ${interval} anos`
    }
    return translations[type]
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: <Badge variant="outline">Baixa</Badge>,
      medium: <Badge variant="secondary">Média</Badge>,
      high: <Badge variant="default" className="bg-orange-600">Alta</Badge>,
      urgent: <Badge variant="destructive">Urgente</Badge>
    }
    return badges[priority as keyof typeof badges] || <Badge>{priority}</Badge>
  }

  if (loading) {
    return <div className="p-6">Carregando templates recorrentes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compras Recorrentes</h2>
          <p className="text-muted-foreground">Configure templates para pedidos automáticos</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Template Recorrente</DialogTitle>
              <DialogDescription>
                Configure um template para geração automática de pedidos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_name">Nome do Template *</Label>
                  <Input
                    id="template_name"
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="Ex: Material de escritório mensal"
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={newTemplate.priority} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do template recorrente"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="frequency_type">Frequência</Label>
                  <Select value={newTemplate.frequency_type} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, frequency_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="frequency_interval">Intervalo</Label>
                  <Input
                    id="frequency_interval"
                    type="number"
                    min="1"
                    value={newTemplate.frequency_interval}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, frequency_interval: Number(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="next_execution">Próxima Execução</Label>
                  <Input
                    id="next_execution"
                    type="datetime-local"
                    value={newTemplate.next_execution_date}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, next_execution_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_center">Centro de Custo</Label>
                  <Input
                    id="cost_center"
                    value={newTemplate.cost_center}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, cost_center: e.target.value }))}
                    placeholder="Ex: ADM, VEN, PRO"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project_code">Código do Projeto</Label>
                  <Input
                    id="project_code"
                    value={newTemplate.project_code}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, project_code: e.target.value }))}
                    placeholder="Ex: PROJ-2024-001"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_submit"
                  checked={newTemplate.auto_submit}
                  onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, auto_submit: checked }))}
                />
                <Label htmlFor="auto_submit">Enviar automaticamente para aprovação</Label>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Itens do Template</h4>
                  <Button onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
                
                {newTemplate.items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Produto/Serviço *</Label>
                          <Input
                            value={item.product_name}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                            placeholder="Nome do produto"
                          />
                        </div>
                        
                        <div>
                          <Label>Quantidade *</Label>
                          <Input
                            type="number"
                            min="1"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label>Preço Unit. Estimado</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.estimated_unit_price}
                            onChange={(e) => updateItem(index, 'estimated_unit_price', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={() => removeItem(index)} variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createTemplate}>
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.template_name}
                    {template.is_active ? (
                      <Badge variant="default" className="bg-green-600">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                    {getPriorityBadge(template.priority)}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                  >
                    {template.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Frequência:</span>
                  <p>{getFrequencyText(template)}</p>
                </div>
                <div>
                  <span className="font-medium">Centro de Custo:</span>
                  <p>{template.cost_center || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Próxima Execução:</span>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.next_execution_date 
                      ? new Date(template.next_execution_date).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium">Auto-envio:</span>
                  <p>{template.auto_submit ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              
              {template.last_executed_date && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Última execução: {new Date(template.last_executed_date).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {templates.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template recorrente</h3>
              <p className="text-muted-foreground mb-4">
                Configure templates para automatizar pedidos recorrentes
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default RecurringPurchases