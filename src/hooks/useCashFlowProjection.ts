import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { addDays, format, startOfDay } from 'date-fns'

export interface CashFlowProjection {
  date: string
  projected_inflow: number
  projected_outflow: number
  projected_balance: number
  confirmed_inflow: number
  confirmed_outflow: number
}

export function useCashFlowProjection(daysAhead: number = 90) {
  const { currentOrg } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [projections, setProjections] = useState<CashFlowProjection[]>([])

  useEffect(() => {
    if (currentOrg?.id) {
      generateProjections()
    }
  }, [currentOrg?.id, daysAhead])

  const generateProjections = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)

      // Buscar saldo atual das contas bancárias
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)

      const currentBalance = bankAccounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

      // Buscar lançamentos futuros
      const today = startOfDay(new Date())
      const endDate = addDays(today, daysAhead)

      const { data: futureEntries } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('org_id', currentOrg.id)
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', format(endDate, 'yyyy-MM-dd'))
        .order('due_date', { ascending: true })

      // Calcular médias históricas
      const { data: historicalTransactions } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('org_id', currentOrg.id)
        .gte('transaction_date', format(addDays(today, -90), 'yyyy-MM-dd'))
        .lte('transaction_date', format(today, 'yyyy-MM-dd'))

      const avgDailyInflow = historicalTransactions
        ?.filter(tx => tx.transaction_type === 'inflow')
        .reduce((sum, tx) => sum + Number(tx.amount), 0) / 90 || 0

      const avgDailyOutflow = historicalTransactions
        ?.filter(tx => tx.transaction_type === 'outflow')
        .reduce((sum, tx) => sum + Number(tx.amount), 0) / 90 || 0

      // Gerar projeções diárias
      const projectionData: CashFlowProjection[] = []
      let runningBalance = currentBalance

      for (let i = 0; i <= daysAhead; i++) {
        const projectionDate = addDays(today, i)
        const dateStr = format(projectionDate, 'yyyy-MM-dd')

        // Lançamentos confirmados para este dia
        const dayEntries = futureEntries?.filter(entry => entry.due_date === dateStr) || []
        
        const confirmedInflow = dayEntries
          .filter(e => e.entry_type === 'receivable')
          .reduce((sum, e) => sum + Number(e.amount), 0)
        
        const confirmedOutflow = dayEntries
          .filter(e => e.entry_type === 'payable')
          .reduce((sum, e) => sum + Number(e.amount), 0)

        // Projeção baseada em médias históricas
        const projectedInflow = confirmedInflow > 0 ? confirmedInflow : avgDailyInflow
        const projectedOutflow = confirmedOutflow > 0 ? confirmedOutflow : avgDailyOutflow

        runningBalance += (projectedInflow - projectedOutflow)

        projectionData.push({
          date: dateStr,
          projected_inflow: projectedInflow,
          projected_outflow: projectedOutflow,
          projected_balance: runningBalance,
          confirmed_inflow: confirmedInflow,
          confirmed_outflow: confirmedOutflow
        })
      }

      setProjections(projectionData)

    } catch (error) {
      console.error('Erro ao gerar projeções:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    projections,
    refreshProjections: generateProjections
  }
}
