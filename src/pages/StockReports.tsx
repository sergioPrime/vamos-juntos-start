import { useState, useEffect } from "react"
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, Package, FileText, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { ResponsiveTable } from "@/components/ui/responsive-table"

interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  unit: string
  stock_quantity: number
  min_stock_level: number
  unit_price: number
  cost_price: number
}

interface StockMovement {
  id: string
  product_id: string
  movement_type: string
  quantity: number
  notes?: string
  created_at: string
  product?: {
    id: string
    name: string
    sku?: string
    unit: string
    category?: string
    stock_quantity: number
    cost_price: number
  }
}

interface StockAnalytics {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  totalMovements: number
  entriesCount: number
  exitsCount: number
  adjustmentsCount: number
}

interface MovementSummary {
  product_id: string
  product_name: string
  product_sku?: string
  total_entries: number
  total_exits: number
  total_adjustments: number
  net_movement: number
  current_stock: number
}

const StockReports = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [analytics, setAnalytics] = useState<StockAnalytics>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalMovements: 0,
    entriesCount: 0,
    exitsCount: 0,
    adjustmentsCount: 0
  })
  const [movementSummary, setMovementSummary] = useState<MovementSummary[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedMovementType, setSelectedMovementType] = useState("all")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (currentOrg?.id) {
      loadData()
    }
  }, [currentOrg, dateFrom, dateTo])

  const loadData = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Extract categories
      const uniqueCategories = [...new Set(productsData?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)

      // Load stock movements for the selected period
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, sku, unit, category, stock_quantity, cost_price)
        `)
        .eq('org_id', currentOrg.id)
        .gte('created_at', `${dateFrom}T00:00:00.000Z`)
        .lte('created_at', `${dateTo}T23:59:59.999Z`)
        .order('created_at', { ascending: false })

      if (movementsError) throw movementsError
      setStockMovements((movementsData || []) as unknown as StockMovement[])

      // Calculate analytics
      calculateAnalytics(productsData || [], (movementsData || []) as unknown as StockMovement[])
      calculateMovementSummary((movementsData || []) as unknown as StockMovement[])

    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (productsData: Product[], movementsData: StockMovement[]) => {
    const totalProducts = productsData.length
    const totalValue = productsData.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0)
    const lowStockCount = productsData.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length
    const outOfStockCount = productsData.filter(p => p.stock_quantity <= 0).length
    
    const totalMovements = movementsData.length
    const entriesCount = movementsData.filter(m => m.movement_type === 'in').length
    const exitsCount = movementsData.filter(m => m.movement_type === 'out').length
    const adjustmentsCount = movementsData.filter(m => m.movement_type === 'adjustment').length

    setAnalytics({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      totalMovements,
      entriesCount,
      exitsCount,
      adjustmentsCount
    })
  }

  const calculateMovementSummary = (movementsData: StockMovement[]) => {
    const summary = new Map<string, MovementSummary>()

    movementsData.forEach(movement => {
      if (!movement.product) return

      const productId = movement.product_id
      const existing = summary.get(productId) || {
        product_id: productId,
        product_name: movement.product.name,
        product_sku: movement.product.sku,
        total_entries: 0,
        total_exits: 0,
        total_adjustments: 0,
        net_movement: 0,
        current_stock: movement.product.stock_quantity
      }

      switch (movement.movement_type) {
        case 'in':
          existing.total_entries += movement.quantity
          existing.net_movement += movement.quantity
          break
        case 'out':
          existing.total_exits += movement.quantity
          existing.net_movement -= movement.quantity
          break
        case 'adjustment':
          existing.total_adjustments += 1
          // For adjustments, the quantity represents the final amount after adjustment
          break
      }

      summary.set(productId, existing)
    })

    setMovementSummary(Array.from(summary.values()).sort((a, b) => a.product_name.localeCompare(b.product_name)))
  }

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(' ', '_')] || ''
        return typeof value === 'string' ? `"${value}"` : value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const exportStockReport = () => {
    const headers = ['Nome do Produto', 'SKU', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Valor Unitário', 'Valor Total']
    const data = products.map(product => ({
      'nome_do_produto': product.name,
      'sku': product.sku || '-',
      'categoria': product.category || '-',
      'estoque_atual': `${product.stock_quantity} ${product.unit}`,
      'estoque_mínimo': `${product.min_stock_level} ${product.unit}`,
      'valor_unitário': product.cost_price.toFixed(2),
      'valor_total': (product.stock_quantity * product.cost_price).toFixed(2)
    }))
    exportToCSV(data, 'relatorio-estoque', headers)
  }

  const exportMovementsReport = () => {
    const headers = ['Data', 'Produto', 'SKU', 'Tipo', 'Quantidade', 'Observações']
    const data = stockMovements.map(movement => ({
      'data': new Date(movement.created_at).toLocaleString(),
      'produto': movement.product?.name || '-',
      'sku': movement.product?.sku || '-',
      'tipo': movement.movement_type === 'in' ? 'Entrada' : movement.movement_type === 'out' ? 'Saída' : 'Ajuste',
      'quantidade': `${movement.quantity} ${movement.product?.unit || ''}`,
      'observações': movement.notes || '-'
    }))
    exportToCSV(data, 'relatorio-movimentacoes', headers)
  }

  const getFilteredMovements = () => {
    return stockMovements.filter(movement => {
      const matchesCategory = selectedCategory === "all" || movement.product?.category === selectedCategory
      const matchesType = selectedMovementType === "all" || movement.movement_type === selectedMovementType
      return matchesCategory && matchesType
    })
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesCategory
    })
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para acessar os relatórios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relatórios de Estoque</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportStockReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Estoque
          </Button>
          <Button variant="outline" onClick={exportMovementsReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Movimentações
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="dateFrom">Data Inicial</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Data Final</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="movementType">Tipo de Movimentação</Label>
            <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stock">Relatório de Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="summary">Resumo por Produto</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos com Estoque Baixo</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analytics.lowStockCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Sem Estoque</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.outOfStockCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Movement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas no Período</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.entriesCount}</div>
                <p className="text-xs text-muted-foreground">
                  {dateFrom} a {dateTo}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saídas no Período</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.exitsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {dateFrom} a {dateTo}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ajustes no Período</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.adjustmentsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {dateFrom} a {dateTo}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredProducts().map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.category || '-'}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            product.stock_quantity <= 0 ? 'text-red-600' :
                            product.stock_quantity <= product.min_stock_level ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stock_quantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell>{product.min_stock_level} {product.unit}</TableCell>
                        <TableCell>
                          <Badge variant={
                            product.stock_quantity <= 0 ? 'destructive' :
                            product.stock_quantity <= product.min_stock_level ? 'destructive' : 'secondary'
                          }>
                            {product.stock_quantity <= 0 ? 'Sem estoque' :
                             product.stock_quantity <= product.min_stock_level ? 'Estoque baixo' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          {(product.stock_quantity * product.cost_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações ({dateFrom} a {dateTo})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredMovements().map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{movement.product?.name}</TableCell>
                        <TableCell>{movement.product?.sku || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            movement.movement_type === 'in' ? 'default' :
                            movement.movement_type === 'out' ? 'destructive' : 'secondary'
                          }>
                            {movement.movement_type === 'in' ? 'Entrada' :
                             movement.movement_type === 'out' ? 'Saída' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.quantity} {movement.product?.unit}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Movimentações por Produto ({dateFrom} a {dateTo})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Entradas</TableHead>
                      <TableHead>Saídas</TableHead>
                      <TableHead>Ajustes</TableHead>
                      <TableHead>Movimento Líquido</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementSummary.map((summary) => (
                      <TableRow key={summary.product_id}>
                        <TableCell className="font-medium">{summary.product_name}</TableCell>
                        <TableCell>{summary.product_sku || '-'}</TableCell>
                        <TableCell className="text-green-600">{summary.total_entries}</TableCell>
                        <TableCell className="text-red-600">{summary.total_exits}</TableCell>
                        <TableCell className="text-blue-600">{summary.total_adjustments}</TableCell>
                        <TableCell className={`font-medium ${
                          summary.net_movement > 0 ? 'text-green-600' :
                          summary.net_movement < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {summary.net_movement > 0 ? '+' : ''}{summary.net_movement}
                        </TableCell>
                        <TableCell className="font-medium">{summary.current_stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StockReports