import { Grid3x3, List, Package, TrendingUp, DollarSign, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  sku?: string
  unit_price: number
  stock_quantity: number
  category?: string
}

interface EnhancedPDVLayoutProps {
  products: Product[]
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onProductClick: (product: Product) => void
  addingToCart: string | null
  searchTerm: string
  todayStats: {
    totalSales: number
    totalAmount: number
    averageTicket: number
  }
}

export function EnhancedPDVLayout({
  products,
  viewMode,
  onViewModeChange,
  onProductClick,
  addingToCart,
  searchTerm,
  todayStats
}: EnhancedPDVLayoutProps) {
  
  const getStockBadgeVariant = (quantity: number) => {
    if (quantity === 0) return 'destructive'
    if (quantity <= 5) return 'default'
    return 'secondary'
  }

  const getStockLabel = (quantity: number) => {
    if (quantity === 0) return 'Sem estoque'
    if (quantity <= 5) return 'Baixo'
    return 'Disponível'
  }

  return (
    <div className="space-y-4">
      {/* Performance Stats - Small Top Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="transition-all hover:shadow-md border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas Hoje</p>
                <p className="text-xl font-bold">{todayStats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total do Dia</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayStats.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md border-chart-3/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <TrendingUp className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayStats.averageTicket)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grade</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
        </div>
        
        {searchTerm && products.length > 0 && (
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-primary/50",
                addingToCart === product.id && "ring-2 ring-primary animate-pulse"
              )}
              onClick={() => onProductClick(product)}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate" title={product.name}>
                      {product.name}
                    </CardTitle>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {product.sku}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={getStockBadgeVariant(product.stock_quantity)}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {getStockLabel(product.stock_quantity)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      minimumFractionDigits: 2 
                    }).format(product.unit_price)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>{product.stock_quantity}</span>
                  </div>
                </div>
                {product.category && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-2">
                    {product.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <Card
              key={product.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                addingToCart === product.id && "ring-2 ring-primary"
              )}
              onClick={() => onProductClick(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{product.name}</h4>
                      <Badge 
                        variant={getStockBadgeVariant(product.stock_quantity)}
                        className="text-xs"
                      >
                        {getStockLabel(product.stock_quantity)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {product.sku && (
                        <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                      )}
                      {product.category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </>
                      )}
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {product.stock_quantity} em estoque
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(product.unit_price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions Helper */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span><kbd className="px-2 py-1 bg-muted rounded">F2</kbd> Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span><kbd className="px-2 py-1 bg-muted rounded">F3</kbd> Desconto</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span><kbd className="px-2 py-1 bg-muted rounded">F4</kbd> Finalizar</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span><kbd className="px-2 py-1 bg-muted rounded">F9</kbd> Suspender</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Missing ShoppingCart import - add it
import { ShoppingCart } from "lucide-react"