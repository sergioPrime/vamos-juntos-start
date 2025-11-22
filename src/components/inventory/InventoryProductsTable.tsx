import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  stock_quantity: number
  min_stock_level: number
  unit_price: number
}

interface InventoryProductsTableProps {
  products: Product[]
  loading?: boolean
}

export function InventoryProductsTable({ products, loading }: InventoryProductsTableProps) {
  const navigate = useNavigate()

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Sem estoque", variant: "destructive" as const }
    if (current <= min) return { label: "Estoque baixo", variant: "secondary" as const }
    return { label: "Normal", variant: "default" as const }
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Nenhum produto encontrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-right">Valor Unit.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const status = getStockStatus(product.stock_quantity, product.min_stock_level)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku || "-"}</TableCell>
                <TableCell>{product.category || "-"}</TableCell>
                <TableCell className="text-right">{product.stock_quantity}</TableCell>
                <TableCell className="text-right">
                  {product.unit_price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
