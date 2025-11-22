import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface InstallmentFilters {
  status?: 'all' | 'pending' | 'settled' | 'overdue';
  entryId?: string;
  personId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface PaginatedInstallmentsResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useInstallmentsPaginated(
  filters: InstallmentFilters = {},
  page: number = 1,
  pageSize: number = 20
) {
  const { currentOrg } = useOrganization();

  return useQuery<PaginatedInstallmentsResponse>({
    queryKey: ['installments-paginated', currentOrg?.id, filters, page, pageSize],
    queryFn: async () => {
      if (!currentOrg?.id) throw new Error('Organization not found');

      let query = supabase
        .from('financial_entry_installments')
        .select(`
          *,
          financial_entries!inner(
            id,
            description,
            entry_type,
            person_id,
            pessoas!financial_entries_person_id_fkey(
              id,
              nome_fantasia
            )
          ),
          payment_methods(name),
          bank_accounts(bank_name, account_number)
        `, { count: 'exact' })
        .eq('org_id', currentOrg.id);

      // Aplicar filtros de status
      const today = new Date().toISOString().split('T')[0];
      
      if (filters.status === 'pending') {
        query = query.eq('is_settled', false).gte('due_date', today);
      } else if (filters.status === 'settled') {
        query = query.eq('is_settled', true);
      } else if (filters.status === 'overdue') {
        query = query.eq('is_settled', false).lt('due_date', today);
      }

      // Filtros específicos
      if (filters.entryId) {
        query = query.eq('entry_id', filters.entryId);
      }

      if (filters.personId) {
        query = query.eq('financial_entries.person_id', filters.personId);
      }

      if (filters.startDate) {
        query = query.gte('due_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }

      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }

      // Busca por texto
      if (filters.searchTerm && filters.searchTerm.trim()) {
        query = query.or(`financial_entries.description.ilike.%${filters.searchTerm}%`);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order('due_date', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
    enabled: !!currentOrg?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
