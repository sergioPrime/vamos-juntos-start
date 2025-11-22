import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface PaginatedQueryOptions {
  table: string
  pageSize?: number
  orderBy?: string
  orderAsc?: boolean
  filters?: Record<string, any>
  select?: string
}

/**
 * Hook para queries paginadas com performance otimizada
 * - Carrega apenas página atual
 * - Pré-carrega próxima página
 * - Cache por página
 */
export function usePaginatedQuery<T = any>({
  table,
  pageSize = 50,
  orderBy = 'created_at',
  orderAsc = false,
  filters = {},
  select = '*'
}: PaginatedQueryOptions) {
  const [currentPage, setCurrentPage] = useState(1)

  // Query da página atual
  const {
    data: pageData,
    isLoading,
    error
  } = useQuery({
    queryKey: [table, 'paginated', currentPage, pageSize, orderBy, orderAsc, filters],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .range(from, to)
        .order(orderBy, { ascending: orderAsc })

      // Aplica filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: (data || []) as T[],
        count: count || 0,
        page: currentPage,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  // Pré-carrega próxima página
  useQuery({
    queryKey: [table, 'paginated', currentPage + 1, pageSize, orderBy, orderAsc, filters],
    queryFn: async () => {
      if (!pageData || currentPage >= pageData.totalPages) return null

      const from = currentPage * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from(table)
        .select(select)
        .range(from, to)
        .order(orderBy, { ascending: orderAsc })

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!pageData && currentPage < pageData.totalPages,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const goToPage = (page: number) => {
    if (page >= 1 && (!pageData || page <= pageData.totalPages)) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (pageData && currentPage < pageData.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return {
    data: pageData?.data || [],
    count: pageData?.count || 0,
    currentPage,
    totalPages: pageData?.totalPages || 0,
    pageSize,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: pageData ? currentPage < pageData.totalPages : false,
    hasPrevPage: currentPage > 1,
  }
}
