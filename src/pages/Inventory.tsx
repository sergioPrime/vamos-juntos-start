import { useState, useEffect } from "react"
import { Search, Package, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, BarChart3, FileText, Plus, Eye, Edit, Trash2, Settings, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IntegrationStatus } from "@/components/integration/IntegrationStatus"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"

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
  created_by: string
  product?: {
    id: string
    name: string
    sku?: string
    unit: string
  }
}

interface InventoryCount {
  id: string
  product_id: string
  counted_quantity: number
  system_quantity: number
  difference: number
  notes?: string
  created_at: string
  created_by: string
  product?: Product
}

const Inventory = () => {
  usePermissionCheck('estoque', 'read')
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  
  // Movement dialog state
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  const [movementFormData, setMovementFormData] = useState({
    product_id: "",
    movement_type: "in",
    quantity: 0,
    notes: ""
  })
  
  // Inventory count dialog state
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false)
  const [inventoryFormData, setInventoryFormData] = useState({
    product_id: "",
    counted_quantity: 0,
    notes: ""
  })

  useEffect(() => {
    if (currentOrg?.id) {
      loadData()
    }
  }, [currentOrg])

  const loadData = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, stock_quantity, min_stock_level, unit_price, cost_price')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Extract categories
      const uniqueCategories = [...new Set(productsData?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)

      // Load stock movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, sku, unit)
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (movementsError) throw movementsError
      setStockMovements((movementsData || []) as unknown as StockMovement[])

    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do estoque.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!movementFormData.product_id || movementFormData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: movementFormData.product_id,
          movement_type: movementFormData.movement_type,
          quantity: movementFormData.quantity,
          notes: movementFormData.notes,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (error) throw error

      toast({
        title: "Movimentação registrada",
        description: "A movimentação de estoque foi registrada com sucesso.",
      })

      setIsMovementDialogOpen(false)
      setMovementFormData({
        product_id: "",
        movement_type: "in",
        quantity: 0,
        notes: ""
      })
      loadData()
    } catch (error) {
      toast({
        title: "Erro ao registrar movimentação",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      })
    }
  }

  const handleInventoryCount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inventoryFormData.product_id || inventoryFormData.counted_quantity < 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      })
      return
    }

    const product = products.find(p => p.id === inventoryFormData.product_id)
    if (!product) return

    const difference = inventoryFormData.counted_quantity - product.stock_quantity

    try {
      // If there's a difference, create an adjustment stock movement
      if (difference !== 0) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: inventoryFormData.product_id,
            movement_type: 'adjustment',
            quantity: inventoryFormData.counted_quantity,
            notes: `Ajuste de inventário: ${inventoryFormData.notes}`,
            org_id: currentOrg?.id,
            created_by: user?.id,
          })

        if (movementError) throw movementError
      }

      toast({
        title: "Contagem de inventário registrada",
        description: difference === 0 ? "Estoque conferido - sem divergências." : `Ajuste aplicado: ${difference > 0 ? '+' : ''}${difference} unidades`,
      })

      setIsInventoryDialogOpen(false)
      setInventoryFormData({
        product_id: "",
        counted_quantity: 0,
        notes: ""
      })
      loadData()
    } catch (error) {
      toast({
        title: "Erro ao registrar contagem",
        description: "Ocorreu um erro ao registrar a contagem de inventário.",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) return { status: "out", label: "Sem estoque", variant: "destructive" as const }
    if (product.stock_quantity <= product.min_stock_level) return { status: "low", label: "Estoque baixo", variant: "destructive" as const }
    return { status: "ok", label: "Normal", variant: "secondary" as const }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'out': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'adjustment': return <RotateCcw className="h-4 w-4 text-blue-600" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada'
      case 'out': return 'Saída'
      case 'adjustment': return 'Ajuste'
      default: return type
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level)
  const outOfStockProducts = products.filter(p => p.stock_quantity <= 0)
  const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0)

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando estoque...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar o estoque.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/inventory/entry', '_blank')}>
            <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
            Entrada de Estoque
          </Button>
          <Button variant="outline" onClick={() => window.open('/inventory/exit', '_blank')}>
            <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
            Saída de Estoque
          </Button>
          <Button variant="outline" onClick={() => window.open('/inventory/transfer', '_blank')}>
            <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
            Transferência
          </Button>
          <Button variant="outline" onClick={() => window.open('/inventory/reports', '_blank')}>
            <BarChart3 className="mr-2 h-4 w-4 text-purple-600" />
            Relatórios Avançados
          </Button>
          <Button variant="outline" onClick={() => window.open('/inventory/alerts', '_blank')}>
            <Bell className="mr-2 h-4 w-4 text-orange-600" />
            Central de Alertas
          </Button>
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Movimento Rápido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStockMovement} className="space-y-4">
                <div>
                  <Label htmlFor="product">Produto *</Label>
                  <Select 
                    value={movementFormData.product_id} 
                    onValueChange={(value) => setMovementFormData(prev => ({...prev, product_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku || 'Sem SKU'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="movement_type">Tipo de Movimentação *</Label>
                    <Select 
                      value={movementFormData.movement_type} 
                      onValueChange={(value) => setMovementFormData(prev => ({...prev, movement_type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Entrada</SelectItem>
                        <SelectItem value="out">Saída</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={movementFormData.quantity}
                      onChange={(e) => setMovementFormData(prev => ({...prev, quantity: Number(e.target.value)}))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={movementFormData.notes}
                    onChange={(e) => setMovementFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Motivo da movimentação, número da nota fiscal, etc."
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Movimentação</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Contagem de Inventário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contagem de Inventário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInventoryCount} className="space-y-4">
                <div>
                  <Label htmlFor="product">Produto *</Label>
                  <Select 
                    value={inventoryFormData.product_id} 
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value)
                      setInventoryFormData(prev => ({
                        ...prev, 
                        product_id: value,
                        counted_quantity: product?.stock_quantity || 0
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Estoque atual: {product.stock_quantity} {product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="counted_quantity">Quantidade Contada *</Label>
                  <Input
                    id="counted_quantity"
                    type="number"
                    min="0"
                    value={inventoryFormData.counted_quantity}
                    onChange={(e) => setInventoryFormData(prev => ({...prev, counted_quantity: Number(e.target.value)}))}
                    required
                  />
                  {inventoryFormData.product_id && (() => {
                    const product = products.find(p => p.id === inventoryFormData.product_id)
                    const difference = inventoryFormData.counted_quantity - (product?.stock_quantity || 0)
                    return difference !== 0 && (
                      <p className={`text-sm mt-1 ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Diferença: {difference > 0 ? '+' : ''}{difference} unidades
                      </p>
                    )
                  })()}
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={inventoryFormData.notes}
                    onChange={(e) => setInventoryFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Observações sobre a contagem"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Contagem</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.slice(0, 10).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.product?.name}</div>
                            <div className="text-sm text-muted-foreground">{movement.product?.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.movement_type)}
                            {getMovementTypeLabel(movement.movement_type)}
                          </div>
                        </TableCell>
                        <TableCell>{movement.quantity} {movement.product?.unit}</TableCell>
                        <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
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
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              product.stock_quantity <= product.min_stock_level 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {product.stock_quantity} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell>{product.min_stock_level} {product.unit}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {product.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            {(product.stock_quantity * product.cost_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.product?.name}</div>
                            <div className="text-sm text-muted-foreground">{movement.product?.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.movement_type)}
                            {getMovementTypeLabel(movement.movement_type)}
                          </div>
                        </TableCell>
                        <TableCell>{movement.quantity} {movement.product?.unit}</TableCell>
                        <TableCell className="max-w-xs">{movement.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Produtos com Estoque Baixo ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell>
                            <span className="font-medium text-red-600">
                              {product.stock_quantity} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell>{product.min_stock_level} {product.unit}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {product.stock_quantity <= 0 ? 'Sem estoque' : 'Estoque baixo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-green-600 mb-2">Estoque em Ordem!</h3>
                <p className="text-muted-foreground text-center">
                  Todos os produtos estão com estoque adequado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Integration Status Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Integrações Automáticas</h2>
        <IntegrationStatus />
      </div>
    </div>
  )
}

export default Inventory