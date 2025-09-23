import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  sku: string
  unit_price: number
  stock_quantity: number
  unit: string
}

interface ProductSelectorProps {
  onSelect: (product: Product) => void
  placeholder?: string
  className?: string
}

export const ProductSelector = ({ onSelect, placeholder = "Selecionar produto...", className }: ProductSelectorProps) => {
  const { currentOrg } = useOrganization()
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentOrg?.id && open) {
      loadProducts()
    }
  }, [currentOrg, open])

  const loadProducts = async () => {
    if (!currentOrg?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, unit_price, stock_quantity, unit')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between ${className}`}
        >
          {placeholder}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar por nome ou SKU..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            {loading ? "Carregando..." : "Nenhum produto encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.sku}`}
                onSelect={() => {
                  onSelect(product)
                  setOpen(false)
                }}
                className="flex flex-col items-start space-y-1 py-2"
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    R$ {product.unit_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex w-full justify-between text-sm text-muted-foreground">
                  <span>SKU: {product.sku}</span>
                  <span>Estoque: {product.stock_quantity} {product.unit}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}