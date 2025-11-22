import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/useDebounce"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useEffect } from "react"

interface InventoryFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
}

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: InventoryFiltersProps) {
  const { currentOrg } = useOrganization()
  const debouncedSearch = useDebounce(searchTerm, 500)

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      const { data } = await supabase
        .from('products')
        .select('category')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .not('category', 'is', null)

      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))]
      return uniqueCategories as string[]
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Log quando o debounce estiver ativo
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      console.log('Debouncing search...', { original: searchTerm, debounced: debouncedSearch })
    }
  }, [searchTerm, debouncedSearch])

  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos por nome ou SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {searchTerm !== debouncedSearch && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
