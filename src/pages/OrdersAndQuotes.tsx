import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Eye, Plus, Settings, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { ColumnManager } from "@/components/finance/ColumnManager"

interface OrderQuote {
  id: string
  number: string
  type: 'order' | 'quote'
  status: string
  customer_name?: string
  total_amount: number
  date: string
  payment_status?: string
}

const statusColors = {
  draft: "secondary",
  confirmed: "default",
  processing: "default", 
  completed: "default",
  cancelled: "destructive",
  pending: "secondary",
  accepted: "default",
  rejected: "destructive"
} as const

const statusLabels = {
  draft: "Rascunho",
  confirmed: "Confirmado", 
  processing: "Processando",
  completed: "Concluído",
  cancelled: "Cancelado",
  pending: "Pendente",
  accepted: "Aceito",
  rejected: "Rejeitado"
}

const defaultColumns = [
  { key: 'type', label: 'Tipo', visible: true },
  { key: 'number', label: 'Número', visible: true },
  { key: 'customer', label: 'Cliente', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'total', label: 'Total', visible: true },
  { key: 'date', label: 'Data', visible: true },
  { key: 'actions', label: 'Ações', visible: true }
]

const OrdersAndQuotes = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [data, setData] = useState<OrderQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<OrderQuote | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [columns, setColumns] = useState(defaultColumns)
  const [showColumnManager, setShowColumnManager] = useState(false)

  useEffect(() => {
    if (currentOrg?.id) {
      loadData()
    } else if (!orgLoading && !currentOrg) {
      setLoading(false)
    }
  }, [currentOrg, orgLoading])

  const loadData = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      // Load orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          order_date,
          payment_status
        `)
        .eq('org_id', currentOrg?.id)

      // Load quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          number,
          status,
          total_amount,
          created_at
        `)
        .eq('org_id', currentOrg?.id)

      if (ordersError) throw ordersError
      if (quotesError) throw quotesError

      // Combine and format data
      const combinedData: OrderQuote[] = [
        ...(orders || []).map(order => ({
          id: order.id,
          number: order.order_number,
          type: 'order' as const,
          status: order.status,
          customer_name: "Cliente não informado",
          total_amount: order.total_amount,
          date: order.order_date,
          payment_status: order.payment_status
        })),
        ...(quotes || []).map(quote => ({
          id: quote.id,
          number: quote.number,
          type: 'quote' as const,
          status: quote.status,
          customer_name: "Cliente não informado",
          total_amount: quote.total_amount,
          date: quote.created_at,
        }))
      ]

      combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setData(combinedData)
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar pedidos e orçamentos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (item: OrderQuote) => {
    setSelectedItem(item)
    setIsDetailDialogOpen(true)
  }

  const filteredData = data.filter(item => {
    const matchesSearch = item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const visibleColumns = columns.filter(col => col.visible)

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar pedidos e orçamentos.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pedidos e Orçamentos</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowColumnManager(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Colunas
            </Button>
            <Button onClick={() => navigate('/orders-quotes/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="order">Pedidos</SelectItem>
                <SelectItem value="quote">Orçamentos</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "Ajuste os filtros ou crie um novo registro."
                : "Comece criando seu primeiro pedido ou orçamento."
              }
            </p>
            <Button onClick={() => navigate('/orders-quotes/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map(item => (
              <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={item.type === 'order' ? 'default' : 'secondary'}>
                          {item.type === 'order' ? 'Pedido' : 'Orçamento'}
                        </Badge>
                        <h3 className="font-semibold text-lg">{item.number}</h3>
                        <Badge variant={statusColors[item.status as keyof typeof statusColors]}>
                          {statusLabels[item.status as keyof typeof statusLabels]}
                        </Badge>
                        {item.payment_status && (
                          <Badge variant="outline">
                            {item.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Cliente:</span>{" "}
                          {item.customer_name || "Não informado"}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>{" "}
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-bold text-lg text-primary">
                            R$ {item.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(item)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Column Manager Dialog */}
        <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Colunas</DialogTitle>
            </DialogHeader>
            <ColumnManager
              columns={columns}
              onColumnsChange={setColumns}
            />
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes do {selectedItem?.type === 'order' ? 'Pedido' : 'Orçamento'}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações Gerais</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Número:</span> {selectedItem.number}</div>
                      <div><span className="font-medium">Tipo:</span> {selectedItem.type === 'order' ? 'Pedido' : 'Orçamento'}</div>
                      <div><span className="font-medium">Status:</span> {statusLabels[selectedItem.status as keyof typeof statusLabels]}</div>
                      <div><span className="font-medium">Data:</span> {new Date(selectedItem.date).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Cliente</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Nome:</span> {selectedItem.customer_name || "Não informado"}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">R$ {selectedItem.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default OrdersAndQuotes