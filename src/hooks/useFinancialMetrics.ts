import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalReceivables: number;
  overdueReceivables: number;
  totalPayables: number;
  overduePayables: number;
  averageTicket: number;
  cashBalance: number;
}

export interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function useFinancialMetrics(startDate?: string, endDate?: string) {
  const { currentOrg } = useOrganization();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalReceivables: 0,
    overdueReceivables: 0,
    totalPayables: 0,
    overduePayables: 0,
    averageTicket: 0,
    cashBalance: 0
  });
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<CategoryData[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      // Definir período padrão (último mês)
      const defaultEndDate = endDate || new Date().toISOString().split('T')[0];
      const defaultStartDate = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

      // Buscar lançamentos do período
      const { data: entries, error: entriesError } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('org_id', currentOrg.id)
        .gte('competence_date', defaultStartDate)
        .lte('competence_date', defaultEndDate);

      if (entriesError) throw entriesError;

      // Calcular receitas e despesas
      const revenue = entries
        ?.filter(e => e.entry_type === 'receivable' && e.is_settled)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const expenses = entries
        ?.filter(e => e.entry_type === 'payable' && e.is_settled)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Calcular a receber
      const receivables = entries
        ?.filter(e => e.entry_type === 'receivable' && !e.is_settled)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const overdueReceivables = entries
        ?.filter(e => e.entry_type === 'receivable' && !e.is_settled && new Date(e.due_date) < new Date())
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Calcular a pagar
      const payables = entries
        ?.filter(e => e.entry_type === 'payable' && !e.is_settled)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const overduePayables = entries
        ?.filter(e => e.entry_type === 'payable' && !e.is_settled && new Date(e.due_date) < new Date())
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Ticket médio
      const settledReceivables = entries?.filter(e => e.entry_type === 'receivable' && e.is_settled) || [];
      const averageTicket = settledReceivables.length > 0 
        ? settledReceivables.reduce((sum, e) => sum + Number(e.amount), 0) / settledReceivables.length
        : 0;

      // Saldo em caixa
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true);

      const cashBalance = bankAccounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

      setMetrics({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        profitMargin,
        totalReceivables: receivables,
        overdueReceivables,
        totalPayables: payables,
        overduePayables,
        averageTicket,
        cashBalance
      });

      // Preparar dados de fluxo de caixa (agrupado por dia/semana/mês)
      const cashFlow = prepareCashFlowData(entries || []);
      setCashFlowData(cashFlow);

      // Preparar dados por categoria
      const revenueCategories = prepareCategoryData(
        entries?.filter(e => e.entry_type === 'receivable' && e.is_settled) || [],
        'revenue'
      );
      setRevenueByCategory(revenueCategories);

      const expenseCategories = prepareCategoryData(
        entries?.filter(e => e.entry_type === 'payable' && e.is_settled) || [],
        'expense'
      );
      setExpensesByCategory(expenseCategories);

    } catch (error: any) {
      console.error('Error loading financial metrics:', error);
      toast.error('Erro ao carregar métricas financeiras');
    } finally {
      setLoading(false);
    }
  };

  const prepareCashFlowData = (entries: any[]): CashFlowData[] => {
    const groupedByDate: Record<string, { inflow: number; outflow: number }> = {};

    entries.forEach(entry => {
      const date = entry.competence_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { inflow: 0, outflow: 0 };
      }

      if (entry.entry_type === 'receivable' && entry.is_settled) {
        groupedByDate[date].inflow += Number(entry.amount);
      } else if (entry.entry_type === 'payable' && entry.is_settled) {
        groupedByDate[date].outflow += Number(entry.amount);
      }
    });

    let balance = 0;
    return Object.entries(groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        balance += data.inflow - data.outflow;
        return {
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          inflow: data.inflow,
          outflow: data.outflow,
          balance
        };
      });
  };

  const prepareCategoryData = (entries: any[], type: 'revenue' | 'expense'): CategoryData[] => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))'
    ];

    const groupedByCategory: Record<string, number> = {};

    entries.forEach(entry => {
      const category = entry.description || 'Outros';
      groupedByCategory[category] = (groupedByCategory[category] || 0) + Number(entry.amount);
    });

    return Object.entries(groupedByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categorias
  };

  useEffect(() => {
    loadMetrics();
  }, [currentOrg?.id, startDate, endDate]);

  return {
    metrics,
    cashFlowData,
    revenueByCategory,
    expensesByCategory,
    loading,
    refreshMetrics: loadMetrics
  };
}
