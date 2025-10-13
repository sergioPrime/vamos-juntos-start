import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  ShoppingCart, Search, Filter, ChevronDown, Plus, Edit, Trash2, 
  ChevronLeft, ChevronRight, FileText, Download, Mail, CheckCircle,
  Eye, Copy, Printer, Package, Truck, AlertCircle, DollarSign, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface OrderQuote {
  id: string
  number: string
  type: 'order' | 'quote'
  status: string
  customer_name?: string
  seller_name?: string
  total_amount: number
  date: string
  payment_method?: string
  nfe?: string
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

const OrdersAndQuotes = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [data, setData] = useState<OrderQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [sortColumn, setSortColumn] = useState<string>('number')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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
          customer_name: "mario sergio mendes",
          seller_name: "SERGIO MENDES",
          total_amount: order.total_amount,
          date: order.order_date,
          payment_method: order.payment_status,
          nfe: ""
        })),
        ...(quotes || []).map(quote => ({
          id: quote.id,
          number: quote.number,
          type: 'quote' as const,
          status: quote.status,
          customer_name: "Cliente não informado",
          seller_name: "",
          total_amount: quote.total_amount,
          date: quote.created_at,
          payment_method: "",
          nfe: ""
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

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredData.map(item => item.id)))
    }
  }

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Action handlers
  const handlePrint = () => {
    toast({
      title: "Imprimindo documentos",
      description: `${selectedItems.size} documento(s) serão impressos.`,
    })
    window.print()
  }

  const handleDuplicate = async () => {
    toast({
      title: "Duplicando documentos",
      description: `${selectedItems.size} documento(s) serão duplicados.`,
    })
    
    // Funcionalidade será implementada posteriormente
    setTimeout(() => {
      toast({
        title: "Duplicação concluída",
        description: "Os documentos foram duplicados com sucesso.",
      })
      setSelectedItems(new Set())
    }, 1000)
  }

  const handleEdit = () => {
    if (selectedItems.size === 1) {
      const itemId = Array.from(selectedItems)[0]
      navigate(`/orders-quotes/${itemId}`)
    } else {
      toast({
        title: "Seleção múltipla",
        description: "Selecione apenas um item para editar.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    const selectedData = data.filter(item => selectedItems.has(item.id))
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Número,Tipo,Status,Cliente,Valor,Data\n" +
      selectedData.map(item => 
        `${item.number},${item.type === 'order' ? 'Pedido' : 'Orçamento'},${statusLabels[item.status as keyof typeof statusLabels]},${item.customer_name},${item.total_amount},${new Date(item.date).toLocaleDateString('pt-BR')}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `pedidos_orcamentos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Download iniciado",
      description: `Arquivo CSV com ${selectedItems.size} documento(s) baixado.`,
    })
  }

  const handleApprove = async () => {
    try {
      const selectedData = data.filter(item => selectedItems.has(item.id))
      
      for (const item of selectedData) {
        if (item.type === 'order') {
          await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', item.id)
        } else {
          await supabase
            .from('quotes')
            .update({ status: 'accepted' })
            .eq('id', item.id)
        }
      }
      
      toast({
        title: "Aprovação concluída",
        description: `${selectedItems.size} documento(s) aprovado(s) com sucesso.`,
      })
      
      setSelectedItems(new Set())
      loadData()
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar os documentos.",
        variant: "destructive",
      })
    }
  }

  const handleReturn = async () => {
    try {
      const selectedData = data.filter(item => selectedItems.has(item.id) && item.type === 'order')
      
      for (const item of selectedData) {
        await supabase
          .from('orders')
          .update({ status: 'returned' })
          .eq('id', item.id)
      }
      
      toast({
        title: "Devolução registrada",
        description: `${selectedData.length} pedido(s) marcado(s) como devolvido(s).`,
      })
      
      setSelectedItems(new Set())
      loadData()
    } catch (error) {
      toast({
        title: "Erro ao processar devolução",
        description: "Não foi possível registrar a devolução.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateBoleto = () => {
    toast({
      title: "Gerando boletos",
      description: `${selectedItems.size} boleto(s) serão gerados.`,
    })
    // Implementar lógica de geração de boleto
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} documento(s)?`)) {
      return
    }
    
    try {
      const selectedData = data.filter(item => selectedItems.has(item.id))
      
      for (const item of selectedData) {
        if (item.type === 'order') {
          await supabase.from('orders').delete().eq('id', item.id)
        } else {
          await supabase.from('quotes').delete().eq('id', item.id)
        }
      }
      
      toast({
        title: "Exclusão concluída",
        description: `${selectedItems.size} documento(s) excluído(s) com sucesso.`,
      })
      
      setSelectedItems(new Set())
      loadData()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os documentos.",
        variant: "destructive",
      })
    }
  }

  const filteredData = data.filter(item => {
    const matchesSearch = item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortColumn as keyof OrderQuote]
    let bValue = b[sortColumn as keyof OrderQuote]
    
    if (sortColumn === 'number') {
      aValue = parseInt(a.number) || 0
      bValue = parseInt(b.number) || 0
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
    <div className="w-full h-full overflow-auto bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">Vendas</div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos e Orçamentos</h1>
          </div>
        </div>

        {/* Quick Actions Modal - Shown when items are selected */}
        {selectedItems.size > 0 && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/50">
            <div className="bg-card border rounded-lg shadow-2xl w-[56rem] mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Action Buttons */}
                <div className="grid grid-cols-8 gap-4 mb-6">
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handlePrint}
                  >
                    <Printer className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Imprimir</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Duplicar</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleEdit}
                  >
                    <Edit className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Editar</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleDownload}
                  >
                    <Download className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Baixar</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Aprovar</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleReturn}
                  >
                    <Package className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Devolver Produtos</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={handleGenerateBoleto}
                  >
                    <DollarSign className="h-6 w-6 mb-2 text-foreground" />
                    <span className="text-xs text-center text-foreground">Gerar Boleto</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-3 hover:bg-destructive/10 rounded-lg transition-colors"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-6 w-6 mb-2 text-destructive" />
                    <span className="text-xs text-center text-destructive">Excluir</span>
                  </button>
                </div>

                {/* Cancel Selection */}
                <div className="flex justify-center pt-4 border-t border-border">
                  <button 
                    className="flex items-center gap-2 p-3 hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setSelectedItems(new Set())}
                  >
                    <X className="h-5 w-5 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Cancelar Seleção</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Pesquisar por Código do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-background"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-0 top-0 h-full bg-black hover:bg-black/90 text-white rounded-l-none"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="bg-black hover:bg-black/90 text-white border-black gap-2"
            >
              <Filter className="h-4 w-4" />
              Busca Avançada
              <span className="ml-1">✕</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Mais Ações
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Exportar Selecionados</DropdownMenuItem>
                <DropdownMenuItem>Imprimir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={() => navigate('/orders-quotes/new')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              NOVO
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-background rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left w-12">
                    <Checkbox 
                      checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th 
                    className="p-3 text-left font-semibold text-sm cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center gap-1">
                      Código
                      {sortColumn === 'number' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-sm">Data</th>
                  <th className="p-3 text-left font-semibold text-sm">Status do Sistema</th>
                  <th className="p-3 text-left font-semibold text-sm">Cliente</th>
                  <th className="p-3 text-left font-semibold text-sm">Vendedor</th>
                  <th className="p-3 text-left font-semibold text-sm">Valor</th>
                  <th className="p-3 text-left font-semibold text-sm">Forma de Pagamento</th>
                  <th className="p-3 text-left font-semibold text-sm">NF-e</th>
                  <th className="p-3 text-right w-12">
                    <Button variant="ghost" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center">
                      <div className="text-muted-foreground">
                        Nenhum registro encontrado
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <Checkbox 
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td className="p-3 text-sm">{item.number}</td>
                      <td className="p-3 text-sm">
                        {new Date(item.date).toLocaleDateString('pt-BR')} - {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <Badge variant="destructive" className="bg-red-600 text-white">
                          {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-orange-600">
                        {item.customer_name}
                      </td>
                      <td className="p-3 text-sm uppercase">
                        {item.seller_name}
                      </td>
                      <td className="p-3 text-sm">
                        R$ {item.total_amount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3 text-sm">
                        {item.payment_method || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {item.nfe || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/orders-quotes/${item.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Resultados por Página</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-16 h-8 text-center"
                />
                <span className="text-sm text-muted-foreground">Ir para a Página</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-black hover:bg-black/90 text-white"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Search Dialog */}
        <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Busca Avançada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Filtros avançados serão implementados aqui.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default OrdersAndQuotes