import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Eye, Zap, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useOrderIntegration } from "@/hooks/useOrderIntegration"

interface Order {
  id: string
  order_number: string
  status: string
  order_type: string
  subtotal: number
  total_amount: number
  payment_status: string
  payment_method?: string
  order_date: string
  completed_at?: string
  notes?: string
  customers?: {
    name: string
    email?: string
  } | null
  order_items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
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

const paymentStatusColors = {
  pending: "secondary",
  partial: "default",
  paid: "default",
  refunded: "destructive"
} as const

const paymentStatusLabels = {
  pending: "Pendente",
  partial: "Parcial",
  paid: "Pago",
  refunded: "Reembolsado"
}

const Orders = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { completeOrderWithIntegration } = useOrderIntegration()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrg?.id) {
      loadOrders()
    } else if (!orgLoading && !currentOrg) {
      setLoading(false)
    }
  }, [currentOrg, orgLoading])

  const loadOrders = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          ),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('org_id', currentOrg?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders((data as any) || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }

  const completeOrder = async (order: Order) => {
    try {
      await completeOrderWithIntegration(order.id)
      toast({
        title: "Pedido finalizado",
        description: "Pedido finalizado com sucesso. Estoque atualizado automaticamente.",
      })
      loadOrders()
    } catch (error) {
      toast({
        title: "Erro ao finalizar pedido",
        description: "Não foi possível finalizar o pedido.",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter
    return matchesSearch && matchesStatus && matchesPayment
  })

  // Show loading if organization is still loading or if orders are loading
  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando pedidos...</div>
      </div>
    )
  }

  // Show message if no organization is found
  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar pedidos.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/orders/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
          <Button variant="outline" onClick={() => navigate('/pdv')}>
            Nova Venda (PDV)
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos por número ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pagamentos</SelectItem>
              {Object.entries(paymentStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
              ? "Ajuste os filtros ou crie um novo pedido."
              : "Comece criando seu primeiro pedido no PDV."
            }
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/orders/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Button>
            <Button variant="outline" onClick={() => navigate('/pdv')}>
              Nova Venda (PDV)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{order.order_number}</h3>
                      <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant={paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors]}>
                        {paymentStatusLabels[order.payment_status as keyof typeof paymentStatusLabels]}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Cliente:</span>{" "}
                        {order.customers?.name || "Cliente não informado"}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span>{" "}
                        {new Date(order.order_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <span className="font-medium">Pagamento:</span>{" "}
                        {order.payment_method || "Não informado"}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} itens
                      </span>
                      <span className="font-bold text-lg text-primary">
                        R$ {order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOrderDetail(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Detalhes
                    </Button>
                    {order.status === 'confirmed' && order.payment_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => completeOrder(order)}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Finalizar Pedido
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações Gerais</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Número:</span> {selectedOrder.order_number}</div>
                    <div><span className="font-medium">Status:</span> {statusLabels[selectedOrder.status as keyof typeof statusLabels]}</div>
                    <div><span className="font-medium">Tipo:</span> {selectedOrder.order_type}</div>
                    <div><span className="font-medium">Data:</span> {new Date(selectedOrder.order_date).toLocaleString('pt-BR')}</div>
                    {selectedOrder.completed_at && (
                      <div><span className="font-medium">Concluído em:</span> {new Date(selectedOrder.completed_at).toLocaleString('pt-BR')}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Pagamento</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Status:</span> {paymentStatusLabels[selectedOrder.payment_status as keyof typeof paymentStatusLabels]}</div>
                    <div><span className="font-medium">Método:</span> {selectedOrder.payment_method || "Não informado"}</div>
                  </div>
                </div>
              </div>

              {selectedOrder.customers && (
                <div>
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Nome:</span> {selectedOrder.customers.name}</div>
                    {selectedOrder.customers.email && (
                      <div><span className="font-medium">Email:</span> {selectedOrder.customers.email}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} x R$ {item.unit_price.toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium">
                          R$ {item.total_price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">R$ {selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Orders