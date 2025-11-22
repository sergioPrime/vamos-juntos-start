import { TrendingUp, TrendingDown, RotateCcw, BarChart3, Bell, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

export function InventoryHeader() {
  const { currentOrg } = useOrganization()

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null

      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity, min_stock_level')
        .eq('org_id', currentOrg.id)
        .eq('active', true)

      const lowStock = products?.filter(p => p.stock_quantity <= p.min_stock_level).length || 0
      const outOfStock = products?.filter(p => p.stock_quantity <= 0).length || 0

      return { lowStock, outOfStock }
    },
    enabled: !!currentOrg?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  const getCriticalityLevel = () => {
    if (!stats) return 'normal'
    if (stats.outOfStock > 5) return 'critical'
    if (stats.lowStock > 5) return 'warning'
    return 'normal'
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
          {getCriticalityLevel() !== 'normal' && stats && (
            <Badge variant={getCriticalityLevel() === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.outOfStock > 0 && `${stats.outOfStock} sem estoque`}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Controle total do seu inventário e movimentações
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('/inventory/entry', '_blank')}
        >
          <TrendingUp className="mr-2 h-4 w-4 text-success" />
          <span className="hidden sm:inline">Entrada</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('/inventory/exit', '_blank')}
        >
          <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
          <span className="hidden sm:inline">Saída</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('/inventory/transfer', '_blank')}
        >
          <RotateCcw className="mr-2 h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Transferência</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('/inventory/reports', '_blank')}
        >
          <BarChart3 className="mr-2 h-4 w-4 text-chart-3" />
          <span className="hidden sm:inline">Relatórios</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('/inventory/alerts', '_blank')}
        >
          <Bell className="mr-2 h-4 w-4 text-warning" />
          <span className="hidden sm:inline">Alertas</span>
        </Button>
      </div>
    </div>
  )
}
