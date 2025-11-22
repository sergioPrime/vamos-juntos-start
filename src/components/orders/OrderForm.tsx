import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Save, Plus, Trash2, Package, Truck, FileText, Printer, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useSidebarConfig } from "@/contexts/SidebarConfigContext"
import { ProductionOrderDialog } from "@/components/production/ProductionOrderDialog"
import { ShippingLabelTemplate } from "@/components/logistics/ShippingLabelTemplate"
import { ExchangeVoucherTemplate } from "@/components/logistics/ExchangeVoucherTemplate"

interface OrderItem {
  id?: string
  product_id?: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount?: number
}

interface OrderFormData {
  number: string
  status: string
  order_type: string
  customer_id?: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  payment_status: string
  payment_method?: string
  delivery_date?: string
  notes?: string
  order_items: OrderItem[]
}

const statusColors = {
  draft: "secondary",
  confirmed: "default",
  processing: "default",
  completed: "default",
  cancelled: "destructive"
} as const

const statusLabels = {
  draft: "Rascunho",
  confirmed: "Confirmado", 
  processing: "Processando",
  completed: "Concluído",
  cancelled: "Cancelado"
}

const OrderForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { lockNumberFields } = useSidebarConfig()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<OrderFormData>({
    number: "",
    status: "draft",
    order_type: "sale",
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    payment_status: "pending",
    order_items: []
  })
  
  const [showProductionDialog, setShowProductionDialog] = useState(false)
  const [showShippingLabel, setShowShippingLabel] = useState(false)
  const [showExchangeVoucher, setShowExchangeVoucher] = useState(false)

  // Keyboard shortcuts
  const shortcuts = [
    { key: 'ctrl+s, cmd+s', action: handleSave, description: 'Salvar pedido' },
    { key: 'ctrl+p, cmd+p', action: () => window.print(), description: 'Imprimir pedido' },
    { key: 'ctrl+i, cmd+i', action: addNewItem, description: 'Adicionar item' },
    { key: 'ctrl+shift+o, cmd+shift+o', action: () => setShowProductionDialog(true), description: 'Gerar ordem de produção' },
    { key: 'ctrl+shift+l, cmd+shift+l', action: () => setShowShippingLabel(true), description: 'Etiqueta de expedição' },
    { key: 'ctrl+shift+t, cmd+shift+t', action: () => setShowExchangeVoucher(true), description: 'Cupom de troca' },
    { key: 'escape', action: () => navigate('/orders'), description: 'Voltar' }
  ]
  
  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    if (id && id !== 'new') {
      loadOrder(id)
    } else if (currentOrg?.id) {
      generateOrderNumber()
    }
  }, [id, currentOrg])

  const generateOrderNumber = async () => {
    if (!currentOrg?.id) return
    
    try {
      // Buscar o maior número existente
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      
      let nextNumber = 1
      if (data && data.length > 0 && data[0].order_number) {
        const lastNumber = parseInt(data[0].order_number) || 0
        nextNumber = lastNumber + 1
      }
      
      setFormData(prev => ({ ...prev, number: nextNumber.toString() }))
    } catch (error) {
      console.error('Error generating order number:', error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o número do pedido.",
        variant: "destructive"
      })
    }
  }

  const generateOrderNumber = () => {
    // Generate sequential number starting from 1
    const nextNumber = "1" // In a real implementation, this would come from the database
    setFormData(prev => ({ ...prev, number: nextNumber }))
  }

  const loadOrder = async (orderId: string) => {
    // Implementation to load order from database
    setLoading(true)
    try {
      // Fetch order data from Supabase
      // setFormData(orderData)
    } catch (error) {
      toast({
        title: "Erro ao carregar pedido",
        description: "Não foi possível carregar os dados do pedido.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!currentOrg?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive"
      })
      return
    }

    // Validação básica
    if (!formData.customer_id) {
      toast({
        title: "Validação",
        description: "Selecione um cliente.",
        variant: "destructive"
      })
      return
    }

    if (formData.order_items.length === 0) {
      toast({
        title: "Validação",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      // 1. Salvar pedido
      const orderData = {
        org_id: currentOrg.id,
        owner_id: user.id,
        order_number: formData.number,
        status: formData.status,
        order_type: formData.order_type,
        customer_id: formData.customer_id,
        subtotal: formData.subtotal,
        discount_amount: formData.discount_amount || 0,
        tax_amount: formData.tax_amount || 0,
        total_amount: formData.total_amount,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        delivery_date: formData.delivery_date,
        notes: formData.notes
      }

      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Salvar itens do pedido
      const orderItemsData = formData.order_items.map(item => ({
        order_id: savedOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) throw itemsError

      toast({
        title: "Pedido salvo",
        description: `Pedido #${formData.number} salvo com sucesso.`
      })

      // Redirecionar para listagem
      navigate('/orders')
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o pedido. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function addNewItem() {
    const newItem: OrderItem = {
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setFormData(prev => ({
      ...prev,
      order_items: [...prev.order_items, newItem]
    }))
  }

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...formData.order_items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setFormData(prev => ({ ...prev, order_items: updatedItems }))
    calculateTotals(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.order_items.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, order_items: updatedItems }))
    calculateTotals(updatedItems)
  }

  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
    const total = subtotal - formData.discount_amount + formData.tax_amount
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      total_amount: total
    }))
  }

  const handleProductionOrder = () => {
    toast({
      title: "Ordem de produção gerada",
      description: "Ordem de produção criada com sucesso."
    })
    setShowProductionDialog(false)
  }

  const handlePrintShippingLabel = () => {
    window.print()
    toast({
      title: "Etiqueta de expedição",
      description: "Etiqueta enviada para impressão."
    })
    setShowShippingLabel(false)
  }

  const handlePrintExchangeVoucher = () => {
    window.print()
    toast({
      title: "Cupom de troca",
      description: "Cupom de troca enviado para impressão."
    })
    setShowExchangeVoucher(false)
  }

  return (
    <div className="container-comfortable min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/orders')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="title-xl">
              {id === 'new' ? 'Novo Pedido' : `Pedido ${formData.number}`}
            </h1>
            <p className="text-muted-foreground">
              {id === 'new' ? 'Criar novo pedido de venda' : 'Editar pedido existente'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[formData.status as keyof typeof statusColors]}>
            {statusLabels[formData.status as keyof typeof statusLabels]}
          </Badge>
          
          {/* Production & Logistics Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Produção e Logística
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowProductionDialog(true)}>
                <Package className="h-4 w-4 mr-2" />
                Gerar Ordem de Produção
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowShippingLabel(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Imprimir Etiqueta de Expedição
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExchangeVoucher(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Emitir Cupom de Troca
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
          {/* Order Details */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Informações do Pedido</CardTitle>
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
                
                <div className="form-field">
                  <Label htmlFor="payment_status">Status do Pagamento</Label>
                  <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="partial">Parcial</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="form-field">
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="bg-level-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="title-md">Itens do Pedido</CardTitle>
                <Button onClick={addNewItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item (Ctrl+I)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.order_items.map((item, index) => (
                <div key={index} className="bg-level-3 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4">
                      <Label>Produto</Label>
                      <div className="space-y-2">
                        <Input
                          value={`${item.product_name}${item.product_sku ? ` (${item.product_sku})` : ''}`}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          placeholder="Nome do produto (SKU)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite o nome e SKU do produto
                        </p>
                      </div>
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
              
              {formData.order_items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-level-2">
            <CardHeader>
              <CardTitle className="title-md">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="financial-sm">R$ {formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span className="financial-sm text-destructive">-R$ {formData.discount_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impostos:</span>
                <span className="financial-sm">R$ {formData.tax_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="financial-md text-primary">R$ {formData.total_amount.toFixed(2)}</span>
              </div>
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
                placeholder="Observações sobre o pedido..."
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
              <Button variant="outline" size="sm" className="w-full" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir (Ctrl+P)
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Gerar NFSe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Order Dialog */}
      <ProductionOrderDialog
        open={showProductionDialog}
        onOpenChange={setShowProductionDialog}
        orderItems={formData.order_items}
        onConfirm={handleProductionOrder}
      />

      {/* Shipping Label Dialog */}
      <Dialog open={showShippingLabel} onOpenChange={setShowShippingLabel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Etiqueta de Expedição</DialogTitle>
          </DialogHeader>
          <ShippingLabelTemplate
            orderNumber={formData.number}
            customerAddress="Rua das Flores, 123 - Centro - São Paulo/SP - 01234-567"
            onPrint={handlePrintShippingLabel}
          />
        </DialogContent>
      </Dialog>

      {/* Exchange Voucher Dialog */}
      <Dialog open={showExchangeVoucher} onOpenChange={setShowExchangeVoucher}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cupom de Troca</DialogTitle>
          </DialogHeader>
          <ExchangeVoucherTemplate
            orderNumber={formData.number}
            totalAmount={formData.total_amount}
            onPrint={handlePrintExchangeVoucher}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrderForm