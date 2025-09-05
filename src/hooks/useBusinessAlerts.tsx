import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface BusinessAlert {
  id: string
  type: 'overdue_receivables' | 'expired_invoices' | 'low_balance' | 'integration_failure' | 'rejected_nfse' | 'budget_exceeded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  action_label?: string
  action_route?: string
  amount?: number
  count?: number
  created_at: string
  resolved: boolean
}

export function useBusinessAlerts() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [alerts, setAlerts] = useState<BusinessAlert[]>([])
  const [loading, setLoading] = useState(false)

  // Check for overdue receivables
  const checkOverdueReceivables = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, title, total_amount, due_date')
        .eq('org_id', currentOrg.id)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())

      if (error) throw error

      if (invoices && invoices.length > 0) {
        const totalOverdue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        
        return [{
          id: 'overdue_receivables',
          type: 'overdue_receivables' as const,
          severity: invoices.length > 5 ? 'critical' as const : 'high' as const,
          title: 'Faturas em atraso',
          description: `${invoices.length} fatura(s) vencida(s) totalizando R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          action_label: 'Ver faturas',
          action_route: '/finance/receivables',
          amount: totalOverdue,
          count: invoices.length,
          created_at: new Date().toISOString(),
          resolved: false
        }]
      }

      return []
    } catch (error) {
      console.error('Error checking overdue receivables:', error)
      return []
    }
  }, [currentOrg?.id])

  // Check for low bank balance
  const checkLowBalance = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: accounts, error } = await supabase
        .from('bank_accounts')
        .select('id, bank_name, balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)

      if (error) throw error

      const lowBalanceAccounts = accounts?.filter(account => account.balance < 1000) || []

      if (lowBalanceAccounts.length > 0) {
        return [{
          id: 'low_balance',
          type: 'low_balance' as const,
          severity: 'medium' as const,
          title: 'Saldo baixo',
          description: `${lowBalanceAccounts.length} conta(s) com saldo abaixo de R$ 1.000,00`,
          action_label: 'Ver contas',
          action_route: '/finance/dashboard',
          count: lowBalanceAccounts.length,
          created_at: new Date().toISOString(),
          resolved: false
        }]
      }

      return []
    } catch (error) {
      console.error('Error checking low balance:', error)
      return []
    }
  }, [currentOrg?.id])

  // Check for budget exceeded
  const checkBudgetExceeded = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: budgets, error } = await supabase
        .from('purchase_budgets')
        .select('id, budget_name, planned_amount, spent_amount')
        .eq('org_id', currentOrg.id)
        .eq('status', 'active')

      if (error) throw error

      const exceededBudgets = budgets?.filter(budget => 
        budget.spent_amount > budget.planned_amount
      ) || []

      if (exceededBudgets.length > 0) {
        return [{
          id: 'budget_exceeded',
          type: 'budget_exceeded' as const,
          severity: 'high' as const,
          title: 'Orçamento excedido',
          description: `${exceededBudgets.length} orçamento(s) ultrapassaram o limite planejado`,
          action_label: 'Ver orçamentos',
          action_route: '/purchases/advanced-features',
          count: exceededBudgets.length,
          created_at: new Date().toISOString(),
          resolved: false
        }]
      }

      return []
    } catch (error) {
      console.error('Error checking budget exceeded:', error)
      return []
    }
  }, [currentOrg?.id])

  // Check for integration failures (mock)
  const checkIntegrationFailures = useCallback(async () => {
    if (!currentOrg?.id) return []

    // Mock data - in real implementation, check api_integrations table
    const hasFailures = Math.random() < 0.3 // 30% chance of having failures

    if (hasFailures) {
      return [{
        id: 'integration_failure',
        type: 'integration_failure' as const,
        severity: 'medium' as const,
        title: 'Falha na integração',
        description: 'Uma ou mais integrações falharam na última sincronização',
        action_label: 'Ver integrações',
        action_route: '/settings',
        created_at: new Date().toISOString(),
        resolved: false
      }]
    }

    return []
  }, [currentOrg?.id])

  // Check all business alerts
  const checkAllAlerts = useCallback(async () => {
    if (!currentOrg?.id) return

    setLoading(true)
    try {
      const [
        overdueAlerts,
        balanceAlerts,
        budgetAlerts,
        integrationAlerts
      ] = await Promise.all([
        checkOverdueReceivables(),
        checkLowBalance(),
        checkBudgetExceeded(),
        checkIntegrationFailures()
      ])

      const allAlerts = [
        ...overdueAlerts,
        ...balanceAlerts,
        ...budgetAlerts,
        ...integrationAlerts
      ]

      setAlerts(allAlerts)

      // Show toast for critical alerts
      const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical')
      criticalAlerts.forEach(alert => {
        toast({
          title: alert.title,
          description: alert.description,
          variant: "destructive",
        })
      })

      return allAlerts
    } catch (error) {
      console.error('Error checking business alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [currentOrg?.id, checkOverdueReceivables, checkLowBalance, checkBudgetExceeded, checkIntegrationFailures, toast])

  // Auto-check alerts on mount and periodically
  useEffect(() => {
    if (currentOrg?.id) {
      checkAllAlerts()
      
      // Check alerts every 10 minutes
      const interval = setInterval(checkAllAlerts, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentOrg?.id, checkAllAlerts])

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }, [])

  const getAlertsByType = useCallback((type: BusinessAlert['type']) => {
    return alerts.filter(alert => alert.type === type && !alert.resolved)
  }, [alerts])

  const getAlertsBySeverity = useCallback((severity: BusinessAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity && !alert.resolved)
  }, [alerts])

  const getUnresolvedAlertsCount = useCallback(() => {
    return alerts.filter(alert => !alert.resolved).length
  }, [alerts])

  return {
    alerts: alerts.filter(alert => !alert.resolved),
    loading,
    checkAllAlerts,
    resolveAlert,
    getAlertsByType,
    getAlertsBySeverity,
    getUnresolvedAlertsCount
  }
}