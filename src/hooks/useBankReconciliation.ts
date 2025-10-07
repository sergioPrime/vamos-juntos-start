import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  matched: boolean
  financial_entry_id?: string
}

export interface FinancialEntryMatch {
  id: string
  description: string
  amount: number
  competence_date: string
  entry_type: 'receivable' | 'payable'
  is_settled: boolean
}

export function useBankReconciliation(bankAccountId?: string) {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const [unmatchedEntries, setUnmatchedEntries] = useState<FinancialEntryMatch[]>([])

  useEffect(() => {
    if (currentOrg?.id && bankAccountId) {
      loadReconciliationData()
    }
  }, [currentOrg?.id, bankAccountId])

  const loadReconciliationData = async () => {
    if (!currentOrg?.id || !bankAccountId) return

    try {
      setLoading(true)

      // Carregar transações bancárias
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('bank_account_id', bankAccountId)
        .order('transaction_date', { ascending: false })

      const bankTxs: BankTransaction[] = transactions?.map(tx => ({
        id: tx.id,
        date: tx.transaction_date,
        description: tx.description || 'Sem descrição',
        amount: Number(tx.amount),
        type: tx.transaction_type === 'inflow' ? 'credit' : 'debit',
        matched: !!tx.reference_id,
        financial_entry_id: tx.reference_id
      })) || []

      setBankTransactions(bankTxs)

      // Carregar lançamentos financeiros não liquidados
      const { data: entries } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('is_settled', false)
        .eq('bank_account_id', bankAccountId)
        .order('due_date', { ascending: false })

      const unmatchedEntriesData: FinancialEntryMatch[] = entries?.map(entry => ({
        id: entry.id,
        description: entry.description || 'Sem descrição',
        amount: Number(entry.amount),
        competence_date: entry.competence_date,
        entry_type: entry.entry_type as 'receivable' | 'payable',
        is_settled: entry.is_settled
      })) || []

      setUnmatchedEntries(unmatchedEntriesData)

    } catch (error) {
      console.error('Erro ao carregar dados de conciliação:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de conciliação',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const matchTransaction = async (transactionId: string, entryId: string) => {
    try {
      // Atualizar transação com referência ao lançamento
      const { error: txError } = await supabase
        .from('financial_transactions')
        .update({ reference_id: entryId, reference_type: 'financial_entry' })
        .eq('id', transactionId)

      if (txError) throw txError

      // Marcar lançamento como liquidado
      const { error: entryError } = await supabase
        .from('financial_entries')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('id', entryId)

      if (entryError) throw entryError

      toast({
        title: 'Sucesso',
        description: 'Transação conciliada com sucesso'
      })

      loadReconciliationData()
    } catch (error) {
      console.error('Erro ao conciliar transação:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao conciliar transação',
        variant: 'destructive'
      })
    }
  }

  const unmatchTransaction = async (transactionId: string) => {
    try {
      const transaction = bankTransactions.find(tx => tx.id === transactionId)
      if (!transaction?.financial_entry_id) return

      // Remover referência da transação
      const { error: txError } = await supabase
        .from('financial_transactions')
        .update({ reference_id: null, reference_type: null })
        .eq('id', transactionId)

      if (txError) throw txError

      // Desmarcar lançamento como não liquidado
      const { error: entryError } = await supabase
        .from('financial_entries')
        .update({ is_settled: false, settled_at: null })
        .eq('id', transaction.financial_entry_id)

      if (entryError) throw entryError

      toast({
        title: 'Sucesso',
        description: 'Conciliação desfeita com sucesso'
      })

      loadReconciliationData()
    } catch (error) {
      console.error('Erro ao desfazer conciliação:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao desfazer conciliação',
        variant: 'destructive'
      })
    }
  }

  return {
    loading,
    bankTransactions,
    unmatchedEntries,
    matchTransaction,
    unmatchTransaction,
    refreshData: loadReconciliationData
  }
}
