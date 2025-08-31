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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { Plus, Search, CheckCircle, XCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react'

interface PurchaseRequest {
  id: string
  request_number: string
  title: string
  description?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  cost_center?: string
  project_code?: string
  expected_delivery_date?: string
  justification?: string
  total_estimated_amount: number
  approval_level: number
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  created_by: string
  items?: PurchaseRequestItem[]
}

interface PurchaseRequestItem {
  id: string
  product_name: string
  description?: string
  quantity: number
  unit: string
  estimated_unit_price: number
  estimated_total_price: number
  justification?: string
  supplier_suggestion?: string
}

interface NewRequestForm {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  cost_center: string
  project_code: string
  expected_delivery_date: string
  justification: string
  items: Omit<PurchaseRequestItem, 'id' | 'estimated_total_price'>[]
}

const PurchaseRequests = () => {
  const { user } = useAuth()
  const { currentOrg: currentOrganization } = useOrganization()
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState<NewRequestForm>({
    title: '',
    description: '',
    priority: 'medium',
    cost_center: '',
    project_code: '',
    expected_delivery_date: '',
    justification: '',
    items: []
  })

  useEffect(() => {
    if (currentOrganization) {
      fetchPurchaseRequests()
    }
  }, [currentOrganization])

  const fetchPurchaseRequests = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      // Temporarily use quotes table as placeholder until types are updated
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(0) // Return empty result for now

      if (error) {
        console.error('Error fetching purchase requests:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar solicitações de compra",
          variant: "destructive",
        })
        return
      }

      // setPurchaseRequests(data || [])
      setPurchaseRequests([]) // Placeholder until types are updated
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar solicitações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateRequestNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    return `SOL-${year}${month}-${timestamp}`
  }

  const calculateApprovalLevel = (totalAmount: number) => {
    if (totalAmount <= 1000) return 1
    if (totalAmount <= 5000) return 2
    if (totalAmount <= 20000) return 3
    return 4
  }

  const createPurchaseRequest = async () => {
    if (!currentOrganization || !user) return

    try {
      const totalAmount = newRequest.items.reduce((sum, item) => sum + (item.quantity * item.estimated_unit_price), 0)
      const requestData = {
        request_number: generateRequestNumber(),
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        cost_center: newRequest.cost_center || null,
        project_code: newRequest.project_code || null,
        expected_delivery_date: newRequest.expected_delivery_date || null,
        justification: newRequest.justification,
        total_estimated_amount: totalAmount,
        approval_level: calculateApprovalLevel(totalAmount),
        status: 'draft',
        org_id: currentOrganization.id,
        created_by: user.id
      }

      // Temporarily disabled until types are updated
      toast({
        title: "Info",
        description: "Funcionalidade temporariamente desabilitada - aguardando atualização dos tipos do banco",
        variant: "default",
      })
      return
      
      /* const { data: request, error: requestError } = await supabase
        .from('purchase_requests')
        .insert(requestData)
        .select()
        .single() */

      /* if (requestError) {
        console.error('Error creating purchase request:', requestError)
        toast({
          title: "Erro",
          description: "Erro ao criar solicitação de compra",
          variant: "destructive",
        })
        return
      }

      // Create items
      if (newRequest.items.length > 0) {
        const itemsData = newRequest.items.map(item => ({
          purchase_request_id: request.id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          estimated_unit_price: item.estimated_unit_price,
          estimated_total_price: item.quantity * item.estimated_unit_price,
          justification: item.justification,
          supplier_suggestion: item.supplier_suggestion
        }))

        const { error: itemsError } = await supabase
          .from('purchase_request_items')
          .insert(itemsData)

        if (itemsError) {
          console.error('Error creating purchase request items:', itemsError)
          toast({
            title: "Erro",
            description: "Erro ao criar itens da solicitação",
            variant: "destructive",
          })
          return
        }
      } */

      toast({
        title: "Sucesso",
        description: "Solicitação de compra criada com sucesso",
      })

      setIsCreateDialogOpen(false)
      setNewRequest({
        title: '',
        description: '',
        priority: 'medium',
        cost_center: '',
        project_code: '',
        expected_delivery_date: '',
        justification: '',
        items: []
      })
      fetchPurchaseRequests()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar solicitação",
        variant: "destructive",
      })
    }
  }

  const addItem = () => {
    setNewRequest(prev => ({
      ...prev,
      items: [...prev.items, {
        product_name: '',
        description: '',
        quantity: 1,
        unit: 'un',
        estimated_unit_price: 0,
        justification: '',
        supplier_suggestion: ''
      }]
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setNewRequest(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeItem = (index: number) => {
    setNewRequest(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="secondary">Rascunho</Badge>,
      pending_approval: <Badge variant="default">Aguardando Aprovação</Badge>,
      approved: <Badge variant="default" className="bg-green-600">Aprovada</Badge>,
      rejected: <Badge variant="destructive">Rejeitada</Badge>,
      cancelled: <Badge variant="outline">Cancelada</Badge>
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
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

  const filteredRequests = purchaseRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.request_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalEstimatedAmount = newRequest.items.reduce((sum, item) => sum + (item.quantity * item.estimated_unit_price), 0)

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Compra</h1>
          <p className="text-muted-foreground">Gerencie requisições internas e workflow de aprovação</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Compra</DialogTitle>
              <DialogDescription>
                Crie uma nova requisição interna de compra
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                <TabsTrigger value="items">Itens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Materiais de escritório Q1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={newRequest.priority} onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, priority: value }))}>
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
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada da solicitação"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_center">Centro de Custo</Label>
                    <Input
                      id="cost_center"
                      value={newRequest.cost_center}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, cost_center: e.target.value }))}
                      placeholder="Ex: ADM, VEN, PRO"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="project_code">Código do Projeto</Label>
                    <Input
                      id="project_code"
                      value={newRequest.project_code}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, project_code: e.target.value }))}
                      placeholder="Ex: PROJ-2024-001"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="expected_delivery">Data Esperada de Entrega</Label>
                  <Input
                    id="expected_delivery"
                    type="date"
                    value={newRequest.expected_delivery_date}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="justification">Justificativa *</Label>
                  <Textarea
                    id="justification"
                    value={newRequest.justification}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, justification: e.target.value }))}
                    placeholder="Justifique a necessidade desta compra"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Itens da Solicitação</h3>
                  <Button onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
                
                {newRequest.items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Produto/Serviço *</Label>
                          <Input
                            value={item.product_name}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                            placeholder="Nome do produto ou serviço"
                          />
                        </div>
                        
                        <div>
                          <Label>Fornecedor Sugerido</Label>
                          <Input
                            value={item.supplier_suggestion}
                            onChange={(e) => updateItem(index, 'supplier_suggestion', e.target.value)}
                            placeholder="Fornecedor preferencial"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
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
                          <Label>Unidade</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            placeholder="un, kg, m²"
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
                        
                        <div>
                          <Label>Total</Label>
                          <Input
                            value={`R$ ${(item.quantity * item.estimated_unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Label>Descrição/Especificação</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Especificações técnicas, marca, modelo, etc."
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <Label>Justificativa</Label>
                          <Textarea
                            value={item.justification}
                            onChange={(e) => updateItem(index, 'justification', e.target.value)}
                            placeholder="Justifique a necessidade deste item"
                          />
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {newRequest.items.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Estimado:</span>
                        <span>R$ {totalEstimatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Nível de Aprovação: {calculateApprovalLevel(totalEstimatedAmount)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={createPurchaseRequest}
                disabled={!newRequest.title || !newRequest.justification || newRequest.items.length === 0}
              >
                Criar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
            <SelectItem value="approved">Aprovada</SelectItem>
            <SelectItem value="rejected">Rejeitada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Nível Aprovação</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono">{request.request_number}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell>R$ {request.total_estimated_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{request.approval_level}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseRequests