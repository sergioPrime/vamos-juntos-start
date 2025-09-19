import { useState, useEffect } from "react"

interface PersistentFiltersConfig {
  key: string
  defaultFilters: any
  useSessionStorage?: boolean
}

export function usePersistentFilters<T>({ 
  key, 
  defaultFilters, 
  useSessionStorage = false 
}: PersistentFiltersConfig) {
  const [filters, setFilters] = useState<T>(defaultFilters)
  
  const storage = useSessionStorage ? sessionStorage : localStorage
  
  // Load filters from storage on mount
  useEffect(() => {
    try {
      const stored = storage.getItem(key)
      if (stored) {
        const parsedFilters = JSON.parse(stored)
        // Restore dates
        Object.keys(parsedFilters).forEach(filterKey => {
          if (filterKey.includes('Date') && parsedFilters[filterKey]) {
            parsedFilters[filterKey] = new Date(parsedFilters[filterKey])
          }
        })
        setFilters({ ...defaultFilters, ...parsedFilters })
      }
    } catch (error) {
      console.warn('Failed to load filters from storage:', error)
    }
  }, [key])
  
  // Save filters to storage whenever they change
  const updateFilters = (newFilters: T) => {
    setFilters(newFilters)
    try {
      storage.setItem(key, JSON.stringify(newFilters))
    } catch (error) {
      console.warn('Failed to save filters to storage:', error)
    }
  }
  
  // Clear filters and storage
  const clearFilters = () => {
    setFilters(defaultFilters)
    try {
      storage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear filters from storage:', error)
    }
  }
  
  return {
    filters,
    updateFilters,
    clearFilters,
    setFilters: updateFilters
  }
}