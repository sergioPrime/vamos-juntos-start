import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { useState, useEffect } from "react"

interface InventoryFiltersProps {
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  categories: string[]
  selectedCategory: string
}

export function InventoryFilters({
  onSearchChange,
  onCategoryChange,
  categories,
  selectedCategory
}: InventoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState("")
  const debouncedSearch = useDebounce(localSearch, 500)

  useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
