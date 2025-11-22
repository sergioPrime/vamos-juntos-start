import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, RotateCcw, Package } from "lucide-react"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { Skeleton } from "@/components/ui/skeleton"

export function StockMovementsTable() {
  const { currentOrg } = useOrganization()

  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, sku, unit)
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-success" />
      case 'out': return <TrendingDown className="h-4 w-4 text-destructive" />
      case 'adjustment': return <RotateCcw className="h-4 w-4 text-primary" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada'
      case 'out': return 'Saída'
      case 'adjustment': return 'Ajuste'
      case 'transfer': return 'Transferência'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
              {!movements || movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {movement.product?.sku || 'Sem SKU'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        {getMovementTypeLabel(movement.movement_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.quantity} {movement.product?.unit}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </CardContent>
    </Card>
  )
}
