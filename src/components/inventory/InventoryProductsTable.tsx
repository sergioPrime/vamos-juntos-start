import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  unit: string
  stock_quantity: number
  min_stock_level: number
  unit_price: number
  cost_price: number
}

interface InventoryProductsTableProps {
  products: Product[]
}

export function InventoryProductsTable({ products }: InventoryProductsTableProps) {
  const navigate = useNavigate()

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { status: "out", label: "Sem estoque", variant: "destructive" as const }
    }
    if (product.stock_quantity <= product.min_stock_level) {
      return { status: "low", label: "Estoque baixo", variant: "destructive" as const }
    }
    return { status: "ok", label: "Normal", variant: "secondary" as const }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum produto encontrado
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-center">Estoque Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Unitário</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = getStockStatus(product)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{product.stock_quantity}</div>
                      <div className="text-xs text-muted-foreground">{product.unit}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.min_stock_level} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.unit_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.stock_quantity * product.cost_price)}
                    </TableCell>
                    <TableCell>
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
      </CardContent>
    </Card>
  )
}
