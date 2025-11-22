import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
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

  const columns = [
    {
      header: "Produto",
      accessor: (product: Product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          {product.sku && (
            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
          )}
        </div>
      ),
    },
    {
      header: "Categoria",
      accessor: (product: Product) => product.category || "-",
    },
    {
      header: "Estoque Atual",
      accessor: (product: Product) => (
        <div className="text-center">
          <div className="font-medium">{product.stock_quantity}</div>
          <div className="text-xs text-muted-foreground">{product.unit}</div>
        </div>
      ),
    },
    {
      header: "Estoque Mínimo",
      accessor: (product: Product) => (
        <div className="text-center">
          {product.min_stock_level} {product.unit}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (product: Product) => {
        const status = getStockStatus(product)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      header: "Valor Unitário",
      accessor: (product: Product) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(product.unit_price),
    },
    {
      header: "Valor Total",
      accessor: (product: Product) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(product.stock_quantity * product.cost_price),
    },
    {
      header: "Ações",
      accessor: (product: Product) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return <ResponsiveTable data={products} columns={columns} />
}
