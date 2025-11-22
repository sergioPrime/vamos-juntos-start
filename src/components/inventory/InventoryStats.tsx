import { Package, BarChart3, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

export function InventoryStats() {
  const { currentOrg } = useOrganization()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['inventory-metrics', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null

      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_level, cost_price')
        .eq('org_id', currentOrg.id)
        .eq('active', true)

      if (!products) return null

      const totalProducts = products.length
      const lowStock = products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length
      const outOfStock = products.filter(p => p.stock_quantity <= 0).length
      const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0)

      return { totalProducts, lowStock, outOfStock, totalValue }
    },
    enabled: !!currentOrg?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Produtos
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground mt-1">Produtos ativos</p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md hover:border-success/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor em Estoque
          </CardTitle>
          <div className="p-2 rounded-lg bg-success/10">
            <BarChart3 className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Valor ao custo</p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md hover:border-warning/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estoque Baixo
          </CardTitle>
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning tracking-tight">
            {stats.lowStock}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.lowStock > 0 ? 'Requer atenção' : 'Níveis adequados'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md hover:border-destructive/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sem Estoque
          </CardTitle>
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive tracking-tight">
            {stats.outOfStock}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.outOfStock > 0 ? 'Ação necessária' : 'Todos em estoque'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
