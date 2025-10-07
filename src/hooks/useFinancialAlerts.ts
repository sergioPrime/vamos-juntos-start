import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'
import { addDays, isBefore, isAfter } from 'date-fns'

export interface FinancialAlert {
  id: string
  type: 'due_soon' | 'overdue' | 'low_balance' | 'high_expense' | 'missing_receipt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  action_label?: string
  action_data?: any
  created_at: string
  dismissed: boolean
}

export function useFinancialAlerts() {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [loading, setLoading] = useState(false)

  const checkDueSoonAlerts = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const threeDaysFromNow = addDays(new Date(), 3)
      const today = new Date()

      const { data: entries } = await supabase
        .from('financial_entries')
        .select('id, description, amount, due_date, entry_type')
        .eq('org_id', currentOrg.id)
        .eq('is_settled', false)
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

      if (!entries?.length) return []

      return entries.map(entry => ({
        id: `due_soon_${entry.id}`,
        type: 'due_soon' as const,
        severity: 'medium' as const,
        title: `Vencimento próximo: ${entry.entry_type === 'receivable' ? 'Receber' : 'Pagar'}`,
        description: `${entry.description} - R$ ${Number(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${entry.due_date}`,
        action_label: 'Ver lançamento',
        action_data: { entry_id: entry.id },
        created_at: new Date().toISOString(),
        dismissed: false
      }))
    } catch (error) {
      console.error('Erro ao verificar vencimentos próximos:', error)
      return []
    }
  }, [currentOrg?.id])

  const checkOverdueAlerts = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const today = new Date()

      const { data: entries } = await supabase
        .from('financial_entries')
        .select('id, description, amount, due_date, entry_type')
        .eq('org_id', currentOrg.id)
        .eq('is_settled', false)
        .lt('due_date', today.toISOString().split('T')[0])

      if (!entries?.length) return []

      const totalOverdue = entries.reduce((sum, e) => sum + Number(e.amount), 0)

      return [{
        id: 'overdue_general',
        type: 'overdue' as const,
        severity: entries.length > 10 ? 'critical' as const : 'high' as const,
        title: `${entries.length} lançamento(s) vencido(s)`,
        description: `Total de R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em lançamentos vencidos`,
        action_label: 'Ver vencidos',
        action_data: { filter: 'overdue' },
        created_at: new Date().toISOString(),
        dismissed: false
      }]
    } catch (error) {
      console.error('Erro ao verificar vencidos:', error)
      return []
    }
  }, [currentOrg?.id])

  const checkLowBalanceAlerts = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id, bank_name, balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .lt('balance', 1000)

      if (!accounts?.length) return []

      return accounts.map(account => ({
        id: `low_balance_${account.id}`,
        type: 'low_balance' as const,
        severity: Number(account.balance) < 500 ? 'high' as const : 'medium' as const,
        title: `Saldo baixo: ${account.bank_name}`,
        description: `Saldo atual: R$ ${Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        action_label: 'Ver conta',
        action_data: { account_id: account.id },
        created_at: new Date().toISOString(),
        dismissed: false
      }))
    } catch (error) {
      console.error('Erro ao verificar saldo baixo:', error)
      return []
    }
  }, [currentOrg?.id])

  const checkHighExpenseAlerts = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const thirtyDaysAgo = addDays(new Date(), -30)
      const sixtyDaysAgo = addDays(new Date(), -60)

      // Despesas dos últimos 30 dias
      const { data: recentExpenses } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('transaction_type', 'outflow')
        .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])

      const recentTotal = recentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      // Despesas dos 30 dias anteriores
      const { data: previousExpenses } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('transaction_type', 'outflow')
        .gte('transaction_date', sixtyDaysAgo.toISOString().split('T')[0])
        .lt('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])

      const previousTotal = previousExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      // Alertar se despesas aumentaram mais de 20%
      if (previousTotal > 0 && recentTotal > previousTotal * 1.2) {
        const increase = ((recentTotal - previousTotal) / previousTotal) * 100

        return [{
          id: 'high_expense',
          type: 'high_expense' as const,
          severity: increase > 50 ? 'high' as const : 'medium' as const,
          title: 'Despesas em alta',
          description: `Despesas aumentaram ${increase.toFixed(1)}% em relação ao período anterior (R$ ${recentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          action_label: 'Ver despesas',
          created_at: new Date().toISOString(),
          dismissed: false
        }]
      }

      return []
    } catch (error) {
      console.error('Erro ao verificar despesas altas:', error)
      return []
    }
  }, [currentOrg?.id])

  const checkAllAlerts = useCallback(async () => {
    if (!currentOrg?.id) return

    setLoading(true)
    try {
      const [dueSoonAlerts, overdueAlerts, lowBalanceAlerts, highExpenseAlerts] = await Promise.all([
        checkDueSoonAlerts(),
        checkOverdueAlerts(),
        checkLowBalanceAlerts(),
        checkHighExpenseAlerts()
      ])

      const allAlerts = [
        ...dueSoonAlerts,
        ...overdueAlerts,
        ...lowBalanceAlerts,
        ...highExpenseAlerts
      ]

      setAlerts(allAlerts)

      // Mostrar toast para alertas críticos
      const criticalAlerts = allAlerts.filter(a => a.severity === 'critical')
      if (criticalAlerts.length > 0) {
        toast({
          title: 'Atenção!',
          description: `${criticalAlerts.length} alerta(s) crítico(s) detectado(s)`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
    } finally {
      setLoading(false)
    }
  }, [currentOrg?.id, checkDueSoonAlerts, checkOverdueAlerts, checkLowBalanceAlerts, checkHighExpenseAlerts, toast])

  useEffect(() => {
    if (currentOrg?.id) {
      checkAllAlerts()
      
      // Verificar alertas a cada 5 minutos
      const interval = setInterval(checkAllAlerts, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentOrg?.id, checkAllAlerts])

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ))
  }, [])

  const getActiveAlerts = useCallback(() => {
    return alerts.filter(a => !a.dismissed)
  }, [alerts])

  const getAlertsBySeverity = useCallback((severity: FinancialAlert['severity']) => {
    return alerts.filter(a => a.severity === severity && !a.dismissed)
  }, [alerts])

  return {
    alerts: getActiveAlerts(),
    loading,
    dismissAlert,
    getAlertsBySeverity,
    refreshAlerts: checkAllAlerts
  }
}
