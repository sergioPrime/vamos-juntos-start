import React, { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SearchResult {
  id: string
  name: string
  code?: string
}

interface ComboboxAsyncProps {
  value?: string
  onValueChange: (value: string) => void
  searchFunction: (query: string) => Promise<SearchResult[]>
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function ComboboxAsync({
  value,
  onValueChange,
  searchFunction,
  placeholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado",
  className,
  disabled = false
}: ComboboxAsyncProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)

  // Load initial data when value changes externally
  useEffect(() => {
    if (value && !selectedItem) {
      // Try to find the item in current results first
      const item = searchResults.find(item => item.id === value)
      if (item) {
        setSelectedItem(item)
      }
    }
  }, [value, selectedItem, searchResults])

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length >= 2) {
        setLoading(true)
        try {
          const results = await searchFunction(searchQuery)
          setSearchResults(results)
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setLoading(false)
        }
      } else {
        setSearchResults([])
      }
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchFunction])

  const handleSelect = (selectedValue: string) => {
    const item = searchResults.find(item => item.id === selectedValue)
    if (item) {
      setSelectedItem(item)
      onValueChange(selectedValue)
      setOpen(false)
      setSearchQuery("")
    }
  }

  const handleClear = () => {
    setSelectedItem(null)
    onValueChange("")
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedItem ? selectedItem.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Buscando...
              </div>
            )}
            {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {!loading && searchQuery.length < 2 && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}
            {!loading && searchResults.length > 0 && (
              <CommandGroup>
                {selectedItem && (
                  <CommandItem
                    key="clear"
                    onSelect={handleClear}
                    className="text-muted-foreground"
                  >
                    Limpar seleção
                  </CommandItem>
                )}
                {searchResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}