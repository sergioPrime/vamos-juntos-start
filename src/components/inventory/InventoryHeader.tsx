import { AlertTriangle, TrendingUp, TrendingDown, RotateCcw, BarChart3, Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface InventoryHeaderProps {
  outOfStockCount: number
  lowStockCount: number
  onQuickMovementClick: () => void
}

export function InventoryHeader({ 
  outOfStockCount, 
  lowStockCount, 
  onQuickMovementClick 
}: InventoryHeaderProps) {
  const getCriticalityLevel = () => {
    if (outOfStockCount > 5) return 'critical'
    if (lowStockCount > 5) return 'warning'
    return 'normal'
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
          {getCriticalityLevel() !== 'normal' && (
            <Badge variant={getCriticalityLevel() === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {outOfStockCount > 0 && `${outOfStockCount} sem estoque`}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Controle total do seu inventário e movimentações
        </p>
      </div>
      
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
        
        <Button onClick={onQuickMovementClick}>
          <Plus className="mr-2 h-4 w-4" />
          Movimento Rápido
        </Button>
      </div>
    </div>
  )
}
