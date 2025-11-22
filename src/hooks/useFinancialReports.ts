import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface AgingAnalysis {
  current: AgingBucket;
  days_1_30: AgingBucket;
  days_31_60: AgingBucket;
  days_61_90: AgingBucket;
  over_90: AgingBucket;
  total_amount: number;
  total_count: number;
}

export interface FinancialSummary {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profit_margin: number;
  receivables: number;
  payables: number;
  cash_flow: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  total_amount: number;
  transaction_count: number;
  avg_ticket: number;
}

export interface CategoryBreakdown {
  category_name: string;
  category_code: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export function useFinancialReports() {
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);

  const getAgingAnalysis = useCallback(async (
    referenceDate: string = new Date().toISOString().split('T')[0]
  ): Promise<AgingAnalysis | null> => {
    if (!currentOrg?.id) return null;

    setLoading(true);
    try {
      const { data: installments, error } = await supabase
        .from('financial_entry_installments')
        .select(`
          id,
          amount,
          due_date,
          is_settled,
          entry:financial_entries!inner(
            entry_type,
            org_id
          )
        `)
        .eq('entry.org_id', currentOrg.id)
        .eq('entry.entry_type', 'receivable')
        .eq('is_settled', false)
        .lte('due_date', referenceDate);

      if (error) throw error;

      const refDate = new Date(referenceDate);
      const buckets: Record<string, { count: number; amount: number }> = {
        current: { count: 0, amount: 0 },
        days_1_30: { count: 0, amount: 0 },
        days_31_60: { count: 0, amount: 0 },
        days_61_90: { count: 0, amount: 0 },
        over_90: { count: 0, amount: 0 }
      };

      let totalAmount = 0;
      let totalCount = 0;

      installments?.forEach((inst: any) => {
        const dueDate = new Date(inst.due_date);
        const daysOverdue = Math.floor((refDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        totalAmount += inst.amount;
        totalCount++;

        if (daysOverdue <= 0) {
          buckets.current.count++;
          buckets.current.amount += inst.amount;
        } else if (daysOverdue <= 30) {
          buckets.days_1_30.count++;
          buckets.days_1_30.amount += inst.amount;
        } else if (daysOverdue <= 60) {
          buckets.days_31_60.count++;
          buckets.days_31_60.amount += inst.amount;
        } else if (daysOverdue <= 90) {
          buckets.days_61_90.count++;
          buckets.days_61_90.amount += inst.amount;
        } else {
          buckets.over_90.count++;
          buckets.over_90.amount += inst.amount;
        }
      });

      const createBucket = (key: string, range: string): AgingBucket => ({
        range,
        count: buckets[key].count,
        amount: buckets[key].amount,
        percentage: totalAmount > 0 ? (buckets[key].amount / totalAmount) * 100 : 0
      });

      return {
        current: createBucket('current', 'A vencer'),
        days_1_30: createBucket('days_1_30', '1-30 dias'),
        days_31_60: createBucket('days_31_60', '31-60 dias'),
        days_61_90: createBucket('days_61_90', '61-90 dias'),
        over_90: createBucket('over_90', '90+ dias'),
        total_amount: totalAmount,
        total_count: totalCount
      };
    } catch (error: any) {
      console.error('Erro ao buscar aging:', error);
      toast.error('Erro ao gerar análise aging');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const getFinancialSummary = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<FinancialSummary | null> => {
    if (!currentOrg?.id) return null;

    setLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from('financial_entries')
        .select('entry_type, amount, is_settled')
        .eq('org_id', currentOrg.id)
        .gte('competence_date', startDate)
        .lte('competence_date', endDate);

      if (error) throw error;

      let revenue = 0;
      let expenses = 0;
      let receivables = 0;
      let payables = 0;

      entries?.forEach((entry: any) => {
        if (entry.entry_type === 'receivable') {
          if (entry.is_settled) {
            revenue += entry.amount;
          } else {
            receivables += entry.amount;
          }
        } else if (entry.entry_type === 'payable') {
          if (entry.is_settled) {
            expenses += entry.amount;
          } else {
            payables += entry.amount;
          }
        }
      });

      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const cashFlow = revenue - expenses + receivables - payables;

      return {
        period: `${startDate} a ${endDate}`,
        revenue,
        expenses,
        profit,
        profit_margin: profitMargin,
        receivables,
        payables,
        cash_flow: cashFlow
      };
    } catch (error: any) {
      console.error('Erro ao buscar resumo financeiro:', error);
      toast.error('Erro ao gerar resumo financeiro');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const getTopCustomers = useCallback(async (
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<TopCustomer[]> => {
    if (!currentOrg?.id) return [];

    setLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from('financial_entries')
        .select(`
          person_id,
          amount,
          is_settled
        `)
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', true)
        .gte('competence_date', startDate)
        .lte('competence_date', endDate);

      if (error) throw error;

      // Agregar por cliente
      const customerMap = new Map<string, { total: number; count: number }>();
      
      entries?.forEach((entry: any) => {
        if (!entry.person_id) return;
        
        const current = customerMap.get(entry.person_id) || { total: 0, count: 0 };
        current.total += entry.amount;
        current.count++;
        customerMap.set(entry.person_id, current);
      });

      // Buscar nomes dos clientes
      const customerIds = Array.from(customerMap.keys());
      if (customerIds.length === 0) return [];

      const { data: pessoas } = await supabase
        .from('pessoas')
        .select('id, razao_social')
        .in('id', customerIds);

      const pessoasMap = new Map(pessoas?.map(p => [p.id, p]) || []);

      // Criar array de top clientes
      const topCustomers: TopCustomer[] = Array.from(customerMap.entries())
        .map(([id, data]) => {
          const pessoa = pessoasMap.get(id);
          return {
            id,
            name: pessoa?.razao_social || 'N/A',
            total_amount: data.total,
            transaction_count: data.count,
            avg_ticket: data.total / data.count
          };
        })
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return topCustomers;
    } catch (error: any) {
      console.error('Erro ao buscar top clientes:', error);
      toast.error('Erro ao buscar top clientes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const getCategoryBreakdown = useCallback(async (
    startDate: string,
    endDate: string,
    entryType: 'receivable' | 'payable' = 'payable'
  ): Promise<CategoryBreakdown[]> => {
    if (!currentOrg?.id) return [];

    setLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from('financial_entries')
        .select(`
          amount,
          chart_of_account:chart_of_accounts(
            account_code,
            account_name
          )
        `)
        .eq('org_id', currentOrg.id)
        .eq('entry_type', entryType)
        .eq('is_settled', true)
        .gte('competence_date', startDate)
        .lte('competence_date', endDate);

      if (error) throw error;

      // Agregar por conta contábil
      const categoryMap = new Map<string, { name: string; total: number; count: number }>();
      let totalAmount = 0;

      entries?.forEach((entry: any) => {
        const account = entry.chart_of_account;
        if (!account) return;

        const key = account.account_code;
        const current = categoryMap.get(key) || { name: account.account_name, total: 0, count: 0 };
        current.total += entry.amount;
        current.count++;
        categoryMap.set(key, current);
        totalAmount += entry.amount;
      });

      // Criar array de categorias
      const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([code, data]) => ({
          category_name: data.name,
          category_code: code,
          amount: data.total,
          percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
          transaction_count: data.count
        }))
        .sort((a, b) => b.amount - a.amount);

      return breakdown;
    } catch (error: any) {
      console.error('Erro ao buscar breakdown por categoria:', error);
      toast.error('Erro ao buscar breakdown por categoria');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  return {
    loading,
    getAgingAnalysis,
    getFinancialSummary,
    getTopCustomers,
    getCategoryBreakdown
  };
}
