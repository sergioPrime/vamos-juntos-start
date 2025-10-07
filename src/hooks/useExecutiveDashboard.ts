import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export interface ExecutiveKPIs {
  revenue: {
    current: number
    previous: number
    growth: number
  }
  profit: {
    current: number
    previous: number
    margin: number
  }
  cashFlow: {
    current: number
    projected: number
    variance: number
  }
  receivables: {
    total: number
    overdue: number
    overduePercentage: number
  }
  payables: {
    total: number
    overdue: number
    overduePercentage: number
  }
  workingCapital: number
  liquidityRatio: number
  averageTicket: number
}

export interface MonthlyComparison {
  month: string
  revenue: number
  expenses: number
  profit: number
}

export function useExecutiveDashboard() {
  const { currentOrg } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([])

  useEffect(() => {
    if (currentOrg?.id) {
      loadDashboardData()
    }
  }, [currentOrg?.id])

  const loadDashboardData = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)

      const currentMonthStart = startOfMonth(new Date())
      const currentMonthEnd = endOfMonth(new Date())
      const previousMonthStart = startOfMonth(subMonths(new Date(), 1))
      const previousMonthEnd = endOfMonth(subMonths(new Date(), 1))

      // Buscar receitas e despesas do mês atual
      const { data: currentRevenue } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', true)
        .gte('settled_at', currentMonthStart.toISOString())
        .lte('settled_at', currentMonthEnd.toISOString())

      const { data: currentExpenses } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'payable')
        .eq('is_settled', true)
        .gte('settled_at', currentMonthStart.toISOString())
        .lte('settled_at', currentMonthEnd.toISOString())

      // Buscar receitas e despesas do mês anterior
      const { data: previousRevenue } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', true)
        .gte('settled_at', previousMonthStart.toISOString())
        .lte('settled_at', previousMonthEnd.toISOString())

      const { data: previousExpenses } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'payable')
        .eq('is_settled', true)
        .gte('settled_at', previousMonthStart.toISOString())
        .lte('settled_at', previousMonthEnd.toISOString())

      const currentRevenueTotal = currentRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const currentExpensesTotal = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const previousRevenueTotal = previousRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const previousExpensesTotal = previousExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      const currentProfit = currentRevenueTotal - currentExpensesTotal
      const previousProfit = previousRevenueTotal - previousExpensesTotal

      // Buscar contas a receber
      const { data: receivables } = await supabase
        .from('financial_entries')
        .select('amount, due_date')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', false)

      const totalReceivables = receivables?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const overdueReceivables = receivables?.filter(r => 
        new Date(r.due_date) < new Date()
      ).reduce((sum, r) => sum + Number(r.amount), 0) || 0

      // Buscar contas a pagar
      const { data: payables } = await supabase
        .from('financial_entries')
        .select('amount, due_date')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'payable')
        .eq('is_settled', false)

      const totalPayables = payables?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const overduePayables = payables?.filter(p => 
        new Date(p.due_date) < new Date()
      ).reduce((sum, p) => sum + Number(p.amount), 0) || 0

      // Buscar saldo das contas bancárias
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)

      const totalBalance = bankAccounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

      // Calcular KPIs
      const workingCapital = totalBalance + totalReceivables - totalPayables
      const liquidityRatio = totalPayables > 0 ? (totalBalance + totalReceivables) / totalPayables : 0

      // Buscar dados mensais dos últimos 6 meses
      const monthlyComparison: MonthlyComparison[] = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i))
        const monthEnd = endOfMonth(subMonths(new Date(), i))

        const { data: monthRevenue } = await supabase
          .from('financial_entries')
          .select('amount')
          .eq('org_id', currentOrg.id)
          .eq('entry_type', 'receivable')
          .eq('is_settled', true)
          .gte('settled_at', monthStart.toISOString())
          .lte('settled_at', monthEnd.toISOString())

        const { data: monthExpenses } = await supabase
          .from('financial_entries')
          .select('amount')
          .eq('org_id', currentOrg.id)
          .eq('entry_type', 'payable')
          .eq('is_settled', true)
          .gte('settled_at', monthStart.toISOString())
          .lte('settled_at', monthEnd.toISOString())

        const revenue = monthRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
        const expenses = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

        monthlyComparison.push({
          month: format(monthStart, 'MMM/yy'),
          revenue,
          expenses,
          profit: revenue - expenses
        })
      }

      setKpis({
        revenue: {
          current: currentRevenueTotal,
          previous: previousRevenueTotal,
          growth: previousRevenueTotal > 0 
            ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
            : 0
        },
        profit: {
          current: currentProfit,
          previous: previousProfit,
          margin: currentRevenueTotal > 0 ? (currentProfit / currentRevenueTotal) * 100 : 0
        },
        cashFlow: {
          current: totalBalance,
          projected: totalBalance + totalReceivables - totalPayables,
          variance: totalReceivables - totalPayables
        },
        receivables: {
          total: totalReceivables,
          overdue: overdueReceivables,
          overduePercentage: totalReceivables > 0 ? (overdueReceivables / totalReceivables) * 100 : 0
        },
        payables: {
          total: totalPayables,
          overdue: overduePayables,
          overduePercentage: totalPayables > 0 ? (overduePayables / totalPayables) * 100 : 0
        },
        workingCapital,
        liquidityRatio,
        averageTicket: currentRevenue?.length ? currentRevenueTotal / currentRevenue.length : 0
      })

      setMonthlyData(monthlyComparison)

    } catch (error) {
      console.error('Erro ao carregar dashboard executivo:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    kpis,
    monthlyData,
    refreshDashboard: loadDashboardData
  }
}
