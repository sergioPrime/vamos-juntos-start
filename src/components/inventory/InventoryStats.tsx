import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingDown, AlertTriangle, DollarSign } from "lucide-react"

interface InventoryStatsProps {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
}

export function InventoryStats({
  totalProducts,
  lowStockCount,
  outOfStockCount,
  totalValue
}: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Produtos cadastrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <TrendingDown className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground">
            Produtos com estoque baixo
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          <p className="text-xs text-muted-foreground">
            Produtos sem estoque
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalValue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor em estoque
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
