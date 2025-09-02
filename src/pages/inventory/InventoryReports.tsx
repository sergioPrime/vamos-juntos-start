import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface InventoryReport {
  product_id: string
  product_name: string
  sku?: string
  category?: string
  unit: string
  current_stock: number
  min_stock: number
  max_stock: number
  cost_price: number
  total_value: number
  days_without_movement: number
  last_movement_date?: string
}

interface MovementHistory {
  id: string
  product_name: string
  movement_type: string
  quantity: number
  created_at: string
  notes?: string
}

interface ExpirationReport {
  product_name: string
  lot_number?: string
  expiration_date: string
  quantity: number
  days_to_expire: number
  status: 'expired' | 'expiring_soon' | 'warning'
}

interface StockTurnover {
  product_name: string
  category?: string
  total_sold: number
  avg_stock: number
  turnover_rate: number
  days_in_period: number
}

const InventoryReportsPage = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("current_stock")
  
  // Filter states
  const [dateFilter, setDateFilter] = useState({
    start_date: "",
    end_date: ""
  })
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  
  // Report data states
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([])
  const [movementHistory, setMovementHistory] = useState<MovementHistory[]>([])
  const [lowStockReport, setLowStockReport] = useState<InventoryReport[]>([])
  const [inactiveProducts, setInactiveProducts] = useState<InventoryReport[]>([])
  const [expirationReport, setExpirationReport] = useState<ExpirationReport[]>([])
  const [stockTurnover, setStockTurnover] = useState<StockTurnover[]>([])
  
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (currentOrg?.id) {
      loadInitialData()
    }
  }, [currentOrg])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await loadCurrentStockReport()
      await loadCategories()
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os relatórios de estoque.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('category')
        .eq('org_id', currentOrg?.id)
        .eq('active', true)

      const uniqueCategories = [...new Set(productsData?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadCurrentStockReport = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price')
        .eq('org_id', currentOrg?.id)
        .eq('active', true)
        .order('name')

      const report: InventoryReport[] = productsData?.map(product => ({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        current_stock: product.stock_quantity,
        min_stock: product.min_stock_level || 0,
        max_stock: 0, // Will be updated when max_stock column is available
        cost_price: product.cost_price || 0,
        total_value: (product.stock_quantity || 0) * (product.cost_price || 0),
        days_without_movement: 0, // Will be calculated from stock movements
        last_movement_date: undefined
      })) || []

      setInventoryReport(report)
      
      // Filter low stock products
      const lowStock = report.filter(item => item.current_stock <= item.min_stock)
      setLowStockReport(lowStock)
      
    } catch (error) {
      console.error('Error loading stock report:', error)
    }
  }

  const loadMovementHistory = async () => {
    try {
      const { data: movementsData } = await supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          created_at,
          notes,
          product:products(name)
        `)
        .eq('org_id', currentOrg?.id)
        .order('created_at', { ascending: false })
        .limit(500)

      const history: MovementHistory[] = movementsData?.map(movement => ({
        id: movement.id,
        product_name: (movement.product as any)?.name || 'Produto não encontrado',
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        created_at: movement.created_at,
        notes: movement.notes
      })) || []

      setMovementHistory(history)
    } catch (error) {
      console.error('Error loading movement history:', error)
    }
  }

  const loadInactiveProductsReport = async () => {
    const daysThreshold = 30 // Products without movement for 30 days
    
    try {
      // Get all products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price')
        .eq('org_id', currentOrg?.id)
        .eq('active', true)

      // Get recent movements
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - daysThreshold)
      
      const { data: recentMovements } = await supabase
        .from('stock_movements')
        .select('product_id')
        .eq('org_id', currentOrg?.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const productsWithRecentMovement = new Set(recentMovements?.map(m => m.product_id))
      
      const inactiveProducts: InventoryReport[] = productsData?.filter(product => 
        !productsWithRecentMovement.has(product.id)
      ).map(product => ({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        current_stock: product.stock_quantity,
        min_stock: product.min_stock_level || 0,
        max_stock: 0,
        cost_price: product.cost_price || 0,
        total_value: (product.stock_quantity || 0) * (product.cost_price || 0),
        days_without_movement: daysThreshold,
        last_movement_date: undefined
      })) || []

      setInactiveProducts(inactiveProducts)
    } catch (error) {
      console.error('Error loading inactive products:', error)
    }
  }

  const generateExpirationReport = () => {
    // Mock data for expiration report since we don't have lots table yet
    const mockExpirationData: ExpirationReport[] = [
      {
        product_name: "Produto A",
        lot_number: "L202501001",
        expiration_date: "2025-02-15",
        quantity: 50,
        days_to_expire: 15,
        status: "expiring_soon"
      },
      {
        product_name: "Produto B",
        lot_number: "L202412001",
        expiration_date: "2025-01-10",
        quantity: 25,
        days_to_expire: -20,
        status: "expired"
      }
    ]
    
    setExpirationReport(mockExpirationData)
  }

  const calculateStockTurnover = async () => {
    try {
      // Calculate turnover for the last 90 days
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)
      
      const { data: outboundMovements } = await supabase
        .from('stock_movements')
        .select(`
          product_id,
          quantity,
          product:products(name, category, stock_quantity)
        `)
        .eq('org_id', currentOrg?.id)
        .eq('movement_type', 'out')
        .gte('created_at', startDate.toISOString())

      // Group by product and calculate turnover
      const productSales: { [key: string]: { name: string, category?: string, totalSold: number, avgStock: number } } = {}
      
      outboundMovements?.forEach(movement => {
        const productData = movement.product as any
        if (!productSales[movement.product_id]) {
          productSales[movement.product_id] = {
            name: productData?.name || 'Produto não encontrado',
            category: productData?.category,
            totalSold: 0,
            avgStock: productData?.stock_quantity || 0
          }
        }
        productSales[movement.product_id].totalSold += movement.quantity
      })

      const turnoverData: StockTurnover[] = Object.values(productSales).map(product => ({
        product_name: product.name,
        category: product.category,
        total_sold: product.totalSold,
        avg_stock: product.avgStock,
        turnover_rate: product.avgStock > 0 ? product.totalSold / product.avgStock : 0,
        days_in_period: 90
      })).sort((a, b) => b.turnover_rate - a.turnover_rate)

      setStockTurnover(turnoverData)
    } catch (error) {
      console.error('Error calculating stock turnover:', error)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStockStatusBadge = (current: number, min: number) => {
    if (current <= 0) return <Badge variant="destructive">Sem estoque</Badge>
    if (current <= min) return <Badge variant="destructive">Estoque baixo</Badge>
    return <Badge variant="secondary">Normal</Badge>
  }

  const getExpirationStatusBadge = (status: string) => {
    switch (status) {
      case 'expired': return <Badge variant="destructive">Vencido</Badge>
      case 'expiring_soon': return <Badge variant="destructive">Vence em breve</Badge>
      case 'warning': return <Badge variant="secondary">Atenção</Badge>
      default: return <Badge variant="secondary">Normal</Badge>
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relatórios de Estoque</h1>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="current_stock">Saldo Atual</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="low_stock">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="inactive">Sem Movimento</TabsTrigger>
          <TabsTrigger value="expiration">Validades</TabsTrigger>
          <TabsTrigger value="turnover">Giro de Estoque</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                <Label htmlFor="start_date">Data Inicial</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={dateFilter.start_date}
                  onChange={(e) => setDateFilter(prev => ({...prev, start_date: e.target.value}))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">Data Final</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={dateFilter.end_date}
                  onChange={(e) => setDateFilter(prev => ({...prev, end_date: e.target.value}))}
                />
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="current_stock" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Saldo Atual de Estoque
              </CardTitle>
              <Button variant="outline" onClick={() => exportToCSV(inventoryReport, 'saldo_estoque')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryReport.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.sku || '-'}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.current_stock} {item.unit}</TableCell>
                        <TableCell>{item.min_stock} {item.unit}</TableCell>
                        <TableCell>{getStockStatusBadge(item.current_stock, item.min_stock)}</TableCell>
                        <TableCell>R$ {item.total_value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadMovementHistory}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Carregar
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(movementHistory, 'historico_movimentacoes')}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementHistory.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell>
                          <Badge variant={movement.movement_type === 'in' ? 'secondary' : 'outline'}>
                            {movement.movement_type === 'in' ? 'Entrada' : movement.movement_type === 'out' ? 'Saída' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low_stock" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Produtos com Estoque Baixo
              </CardTitle>
              <Button variant="outline" onClick={() => exportToCSV(lowStockReport, 'estoque_baixo')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Diferença</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockReport.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.current_stock} {item.unit}</TableCell>
                        <TableCell>{item.min_stock} {item.unit}</TableCell>
                        <TableCell className="text-red-600">
                          {item.current_stock - item.min_stock} {item.unit}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(item.current_stock, item.min_stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Produtos sem Movimentação
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadInactiveProductsReport}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Carregar
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(inactiveProducts, 'produtos_inativos')}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Dias sem Movimento</TableHead>
                      <TableHead>Valor Parado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveProducts.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.current_stock} {item.unit}</TableCell>
                        <TableCell className="text-orange-600">{item.days_without_movement} dias</TableCell>
                        <TableCell>R$ {item.total_value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiration" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Relatório de Validades
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateExpirationReport}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(expirationReport, 'relatorio_validades')}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Data de Validade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Dias para Vencer</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expirationReport.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.lot_number || '-'}</TableCell>
                        <TableCell>{new Date(item.expiration_date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className={item.days_to_expire < 0 ? 'text-red-600' : item.days_to_expire < 30 ? 'text-orange-600' : ''}>
                          {item.days_to_expire < 0 ? `${Math.abs(item.days_to_expire)} dias vencido` : `${item.days_to_expire} dias`}
                        </TableCell>
                        <TableCell>{getExpirationStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                Giro de Estoque (Últimos 90 dias)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={calculateStockTurnover}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Calcular
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(stockTurnover, 'giro_estoque')}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Total Vendido</TableHead>
                      <TableHead>Estoque Médio</TableHead>
                      <TableHead>Taxa de Giro</TableHead>
                      <TableHead>Classificação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockTurnover.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.total_sold}</TableCell>
                        <TableCell>{item.avg_stock}</TableCell>
                        <TableCell>{item.turnover_rate.toFixed(2)}x</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.turnover_rate > 2 ? 'default' :
                            item.turnover_rate > 1 ? 'secondary' : 'destructive'
                          }>
                            {item.turnover_rate > 2 ? 'Alto Giro' :
                             item.turnover_rate > 1 ? 'Médio Giro' : 'Baixo Giro'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default InventoryReportsPage