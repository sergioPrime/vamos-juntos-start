import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Save, Plus, Trash2, FileText, Send, Zap, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useSidebarConfig } from "@/contexts/SidebarConfigContext"

interface QuoteItem {
  id?: string
  service_id?: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

interface QuoteFormData {
  number: string
  title: string
  status: string
  customer_id?: string
  description?: string
  notes?: string
  valid_until?: string
  total_amount: number
  quote_items: QuoteItem[]
}

const statusColors = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  expired: "destructive"
} as const

const statusLabels = {
  draft: "Rascunho",
  sent: "Enviado",
  accepted: "Aceito",
  rejected: "Rejeitado",
  expired: "Expirado"
}

const QuoteForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { lockNumberFields } = useSidebarConfig()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<QuoteFormData>({
    number: "",
    title: "",
    status: "draft",
    total_amount: 0,
    quote_items: []
  })

  const handleWhatsAppSend = () => {
    if (!formData.title || formData.quote_items.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e adicione pelo menos um item.",
        variant: "destructive"
      })
      return
    }
    
    const itemsText = formData.quote_items
      .map(item => `• ${item.description} - ${item.quantity}x R$ ${item.unit_price.toFixed(2)} = R$ ${item.total_price.toFixed(2)}`)
      .join('\n')
      
    const message = `🤝 *ORÇAMENTO #${formData.number}*\n\n📋 *${formData.title}*\n\n${itemsText}\n\n💰 *Total: R$ ${formData.total_amount.toFixed(2)}*\n\n📝 ${formData.notes || ''}\n\n✅ Para aceitar este orçamento, responda "ACEITO"`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    
    toast({
      title: "Enviado para WhatsApp",
      description: "Orçamento compartilhado via WhatsApp."
    })
  }

  const handleConvertToPix = () => {
    if (formData.quote_items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione itens ao orçamento antes de converter.",
        variant: "destructive"
      })
      return
    }
    
    navigate("/finance/receivables")
    toast({
      title: "Convertendo em cobrança",
      description: "Redirecionando para gerar cobrança PIX."
    })
  }

  // Keyboard shortcuts
  const shortcuts = [
    { key: 'ctrl+s, cmd+s', action: handleSave, description: 'Salvar orçamento' },
    { key: 'ctrl+p, cmd+p', action: () => window.print(), description: 'Imprimir orçamento' },
    { key: 'ctrl+i, cmd+i', action: addNewItem, description: 'Adicionar item' },
    { key: 'ctrl+e, cmd+e', action: handleWhatsAppSend, description: 'Enviar WhatsApp' },
    { key: 'ctrl+shift+p, cmd+shift+p', action: handleConvertToPix, description: 'Converter em Pix' },
    { key: 'escape', action: () => navigate('/quotes'), description: 'Voltar' }
  ]
  
  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    if (id && id !== 'new') {
      loadQuote(id)
    } else {
      generateQuoteNumber()
    }
  }, [id])

  const generateQuoteNumber = () => {
    // Generate sequential number starting from 1
    const nextNumber = "1" // In a real implementation, this would come from the database
    setFormData(prev => ({ ...prev, number: nextNumber }))
  }

  const loadQuote = async (quoteId: string) => {
    setLoading(true)
    try {
      // Fetch quote data from Supabase
      // setFormData(quoteData)
    } catch (error) {
      toast({
        title: "Erro ao carregar orçamento",
        description: "Não foi possível carregar os dados do orçamento.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!currentOrg?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Orçamento salvo",
      description: "Orçamento salvo com sucesso."
    })
  }

  function addNewItem() {
    const newItem: QuoteItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setFormData(prev => ({
      ...prev,
      quote_items: [...prev.quote_items, newItem]
    }))
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...formData.quote_items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setFormData(prev => ({ ...prev, quote_items: updatedItems }))
    calculateTotal(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.quote_items.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, quote_items: updatedItems }))
    calculateTotal(updatedItems)
  }

  const calculateTotal = (items: QuoteItem[]) => {
    const total = items.reduce((sum, item) => sum + item.total_price, 0)
    setFormData(prev => ({ ...prev, total_amount: total }))
  }

  return (
    <div className="container-comfortable min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/quotes')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="title-xl">
              {id === 'new' ? 'Novo Orçamento' : `Orçamento ${formData.number}`}
            </h1>
            <p className="text-muted-foreground">
              {id === 'new' ? 'Criar novo orçamento' : 'Editar orçamento existente'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[formData.status as keyof typeof statusColors]}>
            {statusLabels[formData.status as keyof typeof statusLabels]}
          </Badge>
          
          {/* Quote Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Ações
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleWhatsAppSend}>
                <Send className="h-4 w-4 mr-2" />
                Enviar WhatsApp (Ctrl+E)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleConvertToPix}>
                <Zap className="h-4 w-4 mr-2" />
                Converter em PIX (Ctrl+Shift+P)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                Imprimir (Ctrl+P)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleSave} className="btn-action-primary">
            <Save className="h-4 w-4 mr-2" />
            Salvar (Ctrl+S)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Informações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="form-comfortable">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="1"
                    disabled={lockNumberFields}
                  />
                </div>
                
                <div className="form-field">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="form-field md:col-span-2">
                  <Label htmlFor="title">Título do Orçamento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Desenvolvimento de site institucional"
                  />
                </div>
                
                <div className="form-field">
                  <Label htmlFor="customer">Cliente</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client-1">João Silva</SelectItem>
                      <SelectItem value="client-2">Maria Santos</SelectItem>
                      <SelectItem value="client-3">Empresa ABC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="form-field">
                  <Label htmlFor="valid_until">Válido até</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card className="bg-level-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="title-md">Itens do Orçamento</CardTitle>
                <Button onClick={addNewItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item (Ctrl+I)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.quote_items.map((item, index) => (
                <div key={index} className="bg-level-3 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4">
                      <Label>Descrição</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Descrição do serviço ou produto"
                        rows={2}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Preço Unitário</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Total</Label>
                      <div className="financial-sm bg-muted/50 p-2 rounded">
                        R$ {item.total_price.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.quote_items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quote Summary */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Itens:</span>
                <span>{formData.quote_items.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="financial-md text-primary">R$ {formData.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Descrição Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição geral do projeto ou serviço..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Condições de pagamento, prazo de entrega, etc..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleWhatsAppSend}
                size="sm"
                className="w-full btn-action-secondary"
              >
                <Send className="h-4 w-4 mr-2" />
                WhatsApp (Ctrl+E)
              </Button>
              <Button
                onClick={handleConvertToPix}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Converter PIX
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default QuoteForm