import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'

interface UseFinancialEntriesPaginatedParams {
  page?: number
  pageSize?: number
  entryType?: 'receivable' | 'payable' | 'all'
  isSettled?: boolean | 'all'
  searchTerm?: string
}

interface PaginatedResponse {
  data: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Hook para buscar lançamentos financeiros com paginação e cache
 * Usa React Query para performance otimizada
 */
export function useFinancialEntriesPaginated({
  page = 1,
  pageSize = 20,
  entryType = 'all',
  isSettled = 'all',
  searchTerm = '',
}: UseFinancialEntriesPaginatedParams = {}) {
  const { currentOrg } = useOrganization()

  return useQuery<PaginatedResponse>({
    queryKey: ['financial-entries-paginated', currentOrg?.id, page, pageSize, entryType, isSettled, searchTerm],
    queryFn: async () => {
      if (!currentOrg?.id) {
        throw new Error('Organization not found')
      }

      // Construir query base
      let query = supabase
        .from('financial_entries')
        .select(`
          *,
          companies (name, document),
          customers:pessoas!financial_entries_person_id_fkey (nome_fantasia, documento),
          suppliers:pessoas!financial_entries_person_id_fkey (nome_fantasia, documento),
          chart_of_accounts (account_code, account_name),
          cost_centers (cost_center_code, cost_center_name),
          payment_methods (name),
          bank_accounts (bank_name, account_number)
        `, { count: 'exact' })
        .eq('org_id', currentOrg.id)

      // Aplicar filtros
      if (entryType !== 'all') {
        query = query.eq('entry_type', entryType)
      }

      if (isSettled !== 'all') {
        query = query.eq('is_settled', isSettled)
      }

      // Busca de texto
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`description.ilike.%${searchTerm}%,customers.nome_fantasia.ilike.%${searchTerm}%,suppliers.nome_fantasia.ilike.%${searchTerm}%`)
      }

      // Paginação
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query
        .order('due_date', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error loading entries:', error)
        throw error
      }

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      }
    },
    enabled: !!currentOrg?.id,
    staleTime: 3 * 60 * 1000, // Cache por 3 minutos
    gcTime: 5 * 60 * 1000, // Mantém por 5 minutos
  })
}
