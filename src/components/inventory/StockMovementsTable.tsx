import { TrendingUp, TrendingDown, RotateCcw, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

interface StockMovementsTableProps {
  movements: StockMovement[]
}

export function StockMovementsTable({ movements }: StockMovementsTableProps) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Entrada'
      case 'out':
        return 'Saída'
      case 'adjustment':
        return 'Ajuste'
      default:
        return type
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'text-green-600'
      case 'out':
        return 'text-red-600'
      case 'adjustment':
        return 'text-blue-600'
      default:
        return ''
    }
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma movimentação registrada
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movement_type)}
                      <span className={getMovementColor(movement.movement_type)}>
                        {getMovementTypeLabel(movement.movement_type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.product?.name}</div>
                      {movement.product?.sku && (
                        <div className="text-xs text-muted-foreground">
                          SKU: {movement.product.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {movement.quantity} {movement.product?.unit}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {movement.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
