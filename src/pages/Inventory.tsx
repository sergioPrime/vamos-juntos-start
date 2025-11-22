import { useState } from "react"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"
import { useOrganization } from "@/hooks/useOrganization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryStats } from "@/components/inventory/InventoryStats"
import { InventoryFilters } from "@/components/inventory/InventoryFilters"
import { InventoryProductsTable } from "@/components/inventory/InventoryProductsTable"
import { StockMovementsTable } from "@/components/inventory/StockMovementsTable"
import { QuickMovementDialog } from "@/components/inventory/QuickMovementDialog"
import { InventoryAlertCenter } from "@/components/inventory/InventoryAlertCenter"

const Inventory = () => {
  usePermissionCheck('estoque', 'read')
  const { currentOrg, loading: orgLoading } = useOrganization()
  const [activeTab, setActiveTab] = useState("produtos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  if (orgLoading) {
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
    <div className="page-container container mx-auto p-6 space-y-6">
      {/* Header com ações rápidas */}
      <InventoryHeader />
      
      {/* Estatísticas em tempo real */}
      <InventoryStats />
      
      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <InventoryProductsTable
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </TabsContent>

        {/* Tab: Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <StockMovementsTable />
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alertas">
          <InventoryAlertCenter />
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Visão</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Produtos</span>
            <span className="sm:hidden">Prod.</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Movimentações</span>
            <span className="sm:hidden">Mov.</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Alertas</span>
            <span className="sm:hidden">Alert.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{products.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Produtos ativos</p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-md hover:border-success/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor em Estoque</CardTitle>
                <div className="p-2 rounded-lg bg-success/10">
                  <BarChart3 className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Valor ao custo</p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-md hover:border-warning/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning tracking-tight">{lowStockProducts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockProducts.length > 0 ? 'Requer atenção' : 'Níveis adequados'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all hover:shadow-md hover:border-destructive/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sem Estoque</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive tracking-tight">{outOfStockProducts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {outOfStockProducts.length > 0 ? 'Ação necessária' : 'Todos em estoque'}
                </p>
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