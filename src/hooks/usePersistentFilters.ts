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
        
        // Restore dates with validation
        Object.keys(parsedFilters).forEach(filterKey => {
          if (filterKey.includes('Date') && parsedFilters[filterKey]) {
            try {
              const dateValue = new Date(parsedFilters[filterKey])
              if (!isNaN(dateValue.getTime())) {
                parsedFilters[filterKey] = dateValue
              } else {
                delete parsedFilters[filterKey]
              }
            } catch {
              delete parsedFilters[filterKey]
            }
          }
        })
        
        // Clear date fields if dateFilterType is "none"
        if (parsedFilters.dateFilterType === "none") {
          delete parsedFilters.startDate
          delete parsedFilters.endDate
          delete parsedFilters.periodType
        }
        
        // Remove legacy dateType field if it exists
        if (parsedFilters.dateType) {
          delete parsedFilters.dateType
        }
        
        setFilters({ ...defaultFilters, ...parsedFilters })
      }
    } catch (error) {
      console.warn('Failed to load filters from storage:', error)
      setFilters(defaultFilters)
    }
  }, [key, defaultFilters])
  
  // Save filters to storage whenever they change
  const updateFilters = (newFilters: T) => {
    // Clean up date fields if dateFilterType is "none"
    const cleanedFilters = { ...newFilters } as any
    if (cleanedFilters.dateFilterType === "none") {
      delete cleanedFilters.startDate
      delete cleanedFilters.endDate
      delete cleanedFilters.periodType
    }
    
    // Remove legacy dateType field if it exists
    if (cleanedFilters.dateType) {
      delete cleanedFilters.dateType
    }
    
    console.log("💾 [PERSISTENT FILTERS] Saving filters to storage:", {
      key,
      filters: cleanedFilters,
      storage: useSessionStorage ? 'session' : 'local'
    })
    
    setFilters(cleanedFilters as T)
    try {
      storage.setItem(key, JSON.stringify(cleanedFilters))
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