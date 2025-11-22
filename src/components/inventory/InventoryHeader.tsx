import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowUpCircle, ArrowDownCircle, RotateCcw, Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface InventoryHeaderProps {
  onQuickMovement: () => void
  totalProducts: number
  lowStockCount: number
}

export function InventoryHeader({ onQuickMovement, totalProducts, lowStockCount }: InventoryHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">
            {totalProducts} produtos
          </Badge>
          {lowStockCount > 0 && (
            <Badge variant="destructive">
              <Bell className="h-3 w-3 mr-1" />
              {lowStockCount} baixos
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/inventory/entry')}
          className="gap-2"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Entrada
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/inventory/exit')}
          className="gap-2"
        >
          <ArrowDownCircle className="h-4 w-4" />
          Saída
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/inventory/transfer')}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Transferência
        </Button>

        <Button
          size="sm"
          onClick={onQuickMovement}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Movimento Rápido
        </Button>
      </div>
    </div>
  )
}
