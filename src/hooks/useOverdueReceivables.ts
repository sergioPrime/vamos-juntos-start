import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface OverdueReceivable {
  id: string
  entry_code: number
  customer_name: string
  customer_id: string | null
  issue_date: string
  due_date: string
  original_amount: number
  open_amount: number
  days_overdue: number
  status: string
  description: string
}

export interface OverdueReceivablesSummary {
  total_documents: number
  total_open_amount: number
  total_overdue_30_days: number
  total_overdue_60_days: number
}

export function useOverdueReceivables() {
  const [receivables, setReceivables] = useState<OverdueReceivable[]>([])
  const [summary, setSummary] = useState<OverdueReceivablesSummary>({
    total_documents: 0,
    total_open_amount: 0,
    total_overdue_30_days: 0,
    total_overdue_60_days: 0
  })
  const [loading, setLoading] = useState(true)
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  const loadOverdueReceivables = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)
      
      // Buscar contas a receber vencidas
      const { data: entries, error } = await supabase
        .from('financial_entries')
        .select(`
          id,
          entry_code,
          description,
          amount,
          due_date,
          is_settled,
          created_at,
          person_id
        `)
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', false)
        .lt('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })

      if (error) throw error

      // Buscar dados dos clientes se necessário
      const personIds = entries?.map(entry => entry.person_id).filter(Boolean) || []
      let customersData: any[] = []
      
      if (personIds.length > 0) {
        const { data: customers } = await supabase
          .from('pessoas')
          .select('id, nome_fantasia')
          .in('id', personIds)
        customersData = customers || []
      }

      // Processar os dados
      const processedReceivables: OverdueReceivable[] = entries?.map(entry => {
        const dueDate = new Date(entry.due_date)
        const today = new Date()
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        const customer = customersData.find(c => c.id === entry.person_id)

        return {
          id: entry.id,
          entry_code: entry.entry_code || 0,
          customer_name: customer?.nome_fantasia || 'Cliente não identificado',
          customer_id: entry.person_id,
          issue_date: entry.created_at,
          due_date: entry.due_date,
          original_amount: Number(entry.amount),
          open_amount: Number(entry.amount), // Para simplificar, assumindo que o valor em aberto é igual ao original
          days_overdue: daysOverdue,
          status: 'Em aberto',
          description: entry.description || 'Conta a receber'
        }
      }) || []

      setReceivables(processedReceivables)

      // Calcular resumo
      const totalDocuments = processedReceivables.length
      const totalOpenAmount = processedReceivables.reduce((sum, item) => sum + item.open_amount, 0)
      const totalOverdue30Days = processedReceivables
        .filter(item => item.days_overdue > 30)
        .reduce((sum, item) => sum + item.open_amount, 0)
      const totalOverdue60Days = processedReceivables
        .filter(item => item.days_overdue > 60)
        .reduce((sum, item) => sum + item.open_amount, 0)

      setSummary({
        total_documents: totalDocuments,
        total_open_amount: totalOpenAmount,
        total_overdue_30_days: totalOverdue30Days,
        total_overdue_60_days: totalOverdue60Days
      })

    } catch (error) {
      console.error('Erro ao carregar contas vencidas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas vencidas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const settleReceivable = async (id: string, paymentMethodId?: string) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .update({
          is_settled: true,
          settled_at: new Date().toISOString(),
          payment_method_id: paymentMethodId
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta quitada com sucesso"
      })

      // Recarregar dados
      loadOverdueReceivables()
    } catch (error) {
      console.error('Erro ao quitar conta:', error)
      toast({
        title: "Erro",
        description: "Não foi possível quitar a conta",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (currentOrg?.id) {
      loadOverdueReceivables()
    } else {
      setLoading(false)
      setReceivables([])
      setSummary({
        total_documents: 0,
        total_open_amount: 0,
        total_overdue_30_days: 0,
        total_overdue_60_days: 0
      })
    }
  }, [currentOrg?.id])

  return {
    receivables,
    summary,
    loading,
    loadOverdueReceivables,
    settleReceivable
  }
}