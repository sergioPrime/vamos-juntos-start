import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/integrations/supabase/client"
import { Search, Plus } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  sku: string | null
  ncm: string | null
  unit: string
  sale_price: number
}

interface ProductSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProduct: (product: Product) => void
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onSelectProduct
}: ProductSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, ncm, unit, sale_price')
        .eq('active', true)
        .order('name')
        .limit(50)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ncm?.includes(searchTerm)
  )

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product)
    onOpenChange(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buscar Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou NCM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg overflow-auto max-h-[50vh]">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Carregando produtos...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Nenhum produto encontrado</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>NCM</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.ncm || '-'}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(product.sale_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
