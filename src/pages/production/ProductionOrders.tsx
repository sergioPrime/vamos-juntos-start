import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Eye, Play, CheckCircle, Plus, Filter, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"

interface ProductionOrder {
  id: string
  order_number: string
  status: string
  priority: string
  due_date: string
  created_at: string
  items_count: number
  order_reference?: string
}

const statusColors = {
  pending: "secondary",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive"
} as const

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em Produção",
  completed: "Concluído",
  cancelled: "Cancelado"
}

const priorityColors = {
  low: "secondary",
  medium: "default",
  high: "default",
  urgent: "destructive"
} as const

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente"
}

const ProductionOrders = () => {
  usePermissionCheck('producao', 'read')
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrg?.id) {
      loadProductionOrders()
    } else if (!orgLoading && !currentOrg) {
      setLoading(false)
    }
  }, [currentOrg, orgLoading])

  const loadProductionOrders = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    
    try {
      // Mock data for demonstration
      const mockOrders: ProductionOrder[] = [
        {
          id: "1",
          order_number: "OP-2024010101",
          status: "pending",
          priority: "high",
          due_date: "2024-01-15",
          created_at: "2024-01-10T10:00:00Z",
          items_count: 3,
          order_reference: "ORD-20240101-ABC123"
        },
        {
          id: "2", 
          order_number: "OP-2024010102",
          status: "in_progress",
          priority: "medium",
          due_date: "2024-01-20",
          created_at: "2024-01-09T14:30:00Z",
          items_count: 5,
          order_reference: "ORD-20240102-DEF456"
        }
      ]
      
      setOrders(mockOrders)
    } catch (error) {
      toast({
        title: "Erro ao carregar ordens de produção",
        description: "Não foi possível carregar as ordens de produção.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openOrderDetail = (order: ProductionOrder) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }

  const startProduction = async (order: ProductionOrder) => {
    try {
      // Update order status to in_progress
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: 'in_progress' } : o
      )
      setOrders(updatedOrders)
      
      toast({
        title: "Produção iniciada",
        description: `Ordem de produção ${order.order_number} iniciada com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao iniciar produção",
        description: "Não foi possível iniciar a produção.",
        variant: "destructive",
      })
    }
  }

  const completeProduction = async (order: ProductionOrder) => {
    try {
      // Update order status to completed
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: 'completed' } : o
      )
      setOrders(updatedOrders)
      
      toast({
        title: "Produção concluída",
        description: `Ordem de produção ${order.order_number} concluída. Estoque atualizado automaticamente.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao concluir produção",
        description: "Não foi possível concluir a produção.",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_reference?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando ordens de produção...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar produção.
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
        <h1 className="text-3xl font-bold">Ordens de Produção</h1>
        <Button onClick={() => navigate('/orders')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem (via Pedido)
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número da ordem ou referência..."
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([value, label]) => (
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
          <div className="text-6xl mb-4">🏭</div>
          <h3 className="text-lg font-medium mb-2">Nenhuma ordem de produção encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
              ? "Ajuste os filtros ou crie uma nova ordem de produção."
              : "Comece criando ordens de produção a partir dos pedidos."
            }
          </p>
          <Button onClick={() => navigate('/orders')}>
            <Plus className="mr-2 h-4 w-4" />
            Ir para Pedidos
          </Button>
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
                      <Badge variant={priorityColors[order.priority as keyof typeof priorityColors]}>
                        {priorityLabels[order.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Pedido Origem:</span>{" "}
                        {order.order_reference || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Prazo:</span>{" "}
                        {new Date(order.due_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <span className="font-medium">Criado em:</span>{" "}
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {order.items_count} itens para produzir
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
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => startProduction(order)}
                        className="btn-action-secondary"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar Produção
                      </Button>
                    )}
                    {order.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => completeProduction(order)}
                        className="btn-action-primary"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir
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
            <DialogTitle>Detalhes da Ordem de Produção</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações Gerais</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Número:</span> {selectedOrder.order_number}</div>
                    <div><span className="font-medium">Status:</span> {statusLabels[selectedOrder.status as keyof typeof statusLabels]}</div>
                    <div><span className="font-medium">Prioridade:</span> {priorityLabels[selectedOrder.priority as keyof typeof priorityLabels]}</div>
                    <div><span className="font-medium">Prazo:</span> {new Date(selectedOrder.due_date).toLocaleDateString('pt-BR')}</div>
                    <div><span className="font-medium">Criado em:</span> {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Pedido de Origem</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Número:</span> {selectedOrder.order_reference || "N/A"}</div>
                    <div><span className="font-medium">Itens:</span> {selectedOrder.items_count}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Itens para Produção</h4>
                <div className="space-y-2">
                  {/* Mock production items */}
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">Produto Personalizado A</div>
                      <div className="text-sm text-muted-foreground">
                        Quantidade: 10 unidades
                      </div>
                    </div>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">Produto Personalizado B</div>
                      <div className="text-sm text-muted-foreground">
                        Quantidade: 5 unidades
                      </div>
                    </div>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductionOrders