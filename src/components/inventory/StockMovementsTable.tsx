import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface StockMovement {
  id: string
  product_id: string
  movement_type: string
  quantity: number
  notes?: string
  created_at: string
  product?: {
    name: string
    sku?: string
  }
}

interface StockMovementsTableProps {
  movements: StockMovement[]
  loading?: boolean
}

export function StockMovementsTable({ movements, loading }: StockMovementsTableProps) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
      case 'entry':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />
      case 'out':
      case 'exit':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />
      case 'transfer':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
      case 'entry':
        return 'Entrada'
      case 'out':
      case 'exit':
        return 'Saída'
      case 'transfer':
        return 'Transferência'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Carregando movimentos...</p>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Nenhum movimento registrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getMovementIcon(movement.movement_type)}
                  <span>{getMovementLabel(movement.movement_type)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{movement.product?.name || "-"}</div>
                  {movement.product?.sku && (
                    <div className="text-sm text-muted-foreground">{movement.product.sku}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{movement.quantity}</TableCell>
              <TableCell>{movement.notes || "-"}</TableCell>
              <TableCell>
                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
