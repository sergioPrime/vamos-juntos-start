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

export interface ReconciliationStats {
  total_transactions: number
  matched_count: number
  unmatched_count: number
  total_credits: number
  total_debits: number
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

  const importOFX = async (file: File): Promise<boolean> => {
    if (!currentOrg?.id || !bankAccountId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma conta bancária primeiro',
        variant: 'destructive'
      })
      return false
    }

    try {
      setLoading(true)
      const content = await file.text()
      const lines = content.split('\n')
      const transactions: any[] = []
      let currentTx: any = {}

      for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('<STMTTRN>')) {
          currentTx = {}
        } else if (trimmed.startsWith('</STMTTRN>')) {
          if (currentTx.date && currentTx.amount !== undefined) {
            transactions.push(currentTx)
          }
          currentTx = {}
        } else if (trimmed.startsWith('<DTPOSTED>')) {
          const dateStr = trimmed.replace(/<\/?DTPOSTED>/g, '').substring(0, 8)
          currentTx.date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        } else if (trimmed.startsWith('<TRNAMT>')) {
          const amount = parseFloat(trimmed.replace(/<\/?TRNAMT>/g, ''))
          currentTx.amount = Math.abs(amount)
          currentTx.type = amount >= 0 ? 'inflow' : 'outflow'
        } else if (trimmed.startsWith('<MEMO>')) {
          currentTx.description = trimmed.replace(/<\/?MEMO>/g, '')
        }
      }

      // Insert transactions
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const transactionsToInsert = transactions.map(t => ({
        org_id: currentOrg.id,
        bank_account_id: bankAccountId,
        transaction_date: t.date,
        description: t.description || 'Transação bancária',
        amount: t.amount,
        transaction_type: t.type,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionsToInsert)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `${transactions.length} transações importadas com sucesso`
      })

      await loadReconciliationData()
      return true
    } catch (error: any) {
      console.error('Erro ao importar OFX:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao importar arquivo OFX',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const importCSV = async (file: File): Promise<boolean> => {
    if (!currentOrg?.id || !bankAccountId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma conta bancária primeiro',
        variant: 'destructive'
      })
      return false
    }

    try {
      setLoading(true)
      const content = await file.text()
      const lines = content.split('\n')
      const transactions: any[] = []

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(/[,;]/)
        if (parts.length < 3) continue

        const dateStr = parts[0].trim()
        const description = parts[1].trim()
        const amountStr = parts[2].trim().replace(/[^\d.,-]/g, '').replace(',', '.')
        const amount = Math.abs(parseFloat(amountStr))

        if (!isNaN(amount) && dateStr) {
          let formattedDate = dateStr
          if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/')
            formattedDate = `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }

          transactions.push({
            date: formattedDate,
            description,
            amount,
            type: amountStr.includes('-') ? 'outflow' : 'inflow'
          })
        }
      }

      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo CSV')
      }

      // Insert transactions
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const transactionsToInsert = transactions.map(t => ({
        org_id: currentOrg.id,
        bank_account_id: bankAccountId,
        transaction_date: t.date,
        description: t.description,
        amount: t.amount,
        transaction_type: t.type,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionsToInsert)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `${transactions.length} transações importadas com sucesso`
      })

      await loadReconciliationData()
      return true
    } catch (error: any) {
      console.error('Erro ao importar CSV:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao importar arquivo CSV',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const getStats = (): ReconciliationStats => {
    return {
      total_transactions: bankTransactions.length,
      matched_count: bankTransactions.filter(t => t.matched).length,
      unmatched_count: bankTransactions.filter(t => !t.matched).length,
      total_credits: bankTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
      total_debits: bankTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  }

  return {
    loading,
    bankTransactions,
    unmatchedEntries,
    matchTransaction,
    unmatchTransaction,
    refreshData: loadReconciliationData,
    importOFX,
    importCSV,
    getStats
  }
}
