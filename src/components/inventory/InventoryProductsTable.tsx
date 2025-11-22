import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useProductCache } from "@/hooks/useProductCache.ts"
import { useDebounce } from "@/hooks/useDebounce.ts"
import { useOrganization } from "@/hooks/useOrganization"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

interface InventoryProductsTableProps {
  searchTerm: string
  selectedCategory: string
}

export function InventoryProductsTable({ searchTerm, selectedCategory }: InventoryProductsTableProps) {
  const { currentOrg } = useOrganization()
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const { data: products, isLoading } = useProductCache.getAll(currentOrg?.id || '')

  // Filtrar produtos
  const filteredProducts = products?.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const getStockStatus = (product: typeof filteredProducts[0]) => {
    if (product.stock_quantity <= 0) 
      return { label: "Sem estoque", variant: "destructive" as const }
    if (product.stock_quantity <= product.min_stock_level) 
      return { label: "Estoque baixo", variant: "destructive" as const }
    return { label: "Normal", variant: "secondary" as const }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
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
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.category || '-'}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            product.stock_quantity <= product.min_stock_level 
                              ? 'text-destructive' 
                              : 'text-success'
                          }`}>
                            {product.stock_quantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell>{product.min_stock_level} {product.unit}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.cost_price)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.stock_quantity * product.cost_price)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
