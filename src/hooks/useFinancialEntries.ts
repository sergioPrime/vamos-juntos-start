import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"
import { useToast } from "@/hooks/use-toast"

export interface FinancialEntry {
  id: string
  org_id: string
  company_id?: string
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  person_id: string
  chart_of_account_id?: string
  amount: number
  payment_method_id?: string
  bank_account_id?: string
  competence_date: string
  due_date: string
  is_settled: boolean
  settled_at?: string
  settled_payment_method_id?: string
  description?: string
  origin_type?: string
  origin_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateFinancialEntryData {
  entry_type: "receivable" | "payable"
  person_id: string
  amount: number
  due_date: string
  competence_date?: string
  description?: string
  origin_type?: "order" | "purchase" | "manual"
  origin_id?: string
  company_id?: string
  chart_of_account_id?: string
  payment_method_id?: string
  bank_account_id?: string
}

export function useFinancialEntries() {
  const organization = useOrganization()
  const { toast } = useToast()
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadEntries()
    }
  }, [organization])

  const loadEntries = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          companies(name),
          customers(name),
          suppliers(name),
          chart_of_accounts(account_name, account_code),
          payment_methods(name),
          bank_accounts(bank_name, account_number)
        `)
        .eq("org_id", organization.currentOrg.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries((data || []) as FinancialEntry[])
    } catch (error) {
      console.error("Error loading financial entries:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos financeiros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async (data: CreateFinancialEntryData): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    try {
      const entryData = {
        ...data,
        org_id: organization.currentOrg.id,
        person_type: data.entry_type === "receivable" ? "customer" : "supplier",
        competence_date: data.competence_date || data.due_date,
        created_by: organization.currentOrg.id, // TODO: Replace with actual user ID
      }

      const { error } = await supabase
        .from("financial_entries")
        .insert([entryData])

      if (error) throw error

      await loadEntries()
      return true
    } catch (error) {
      console.error("Error creating financial entry:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar lançamento financeiro",
        variant: "destructive",
      })
      return false
    }
  }

  const createFromOrder = async (orderId: string, customerId: string, amount: number, dueDate?: string): Promise<boolean> => {
    const calculatedDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return createEntry({
      entry_type: "receivable",
      person_id: customerId,
      amount,
      due_date: calculatedDueDate,
      description: `Conta a receber - Pedido`,
      origin_type: "order",
      origin_id: orderId,
    })
  }

  const createFromPurchase = async (purchaseId: string, supplierId: string, amount: number, dueDate?: string): Promise<boolean> => {
    const calculatedDueDate = dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return createEntry({
      entry_type: "payable",
      person_id: supplierId,
      amount,
      due_date: calculatedDueDate,
      description: `Conta a pagar - Compra`,
      origin_type: "purchase",
      origin_id: purchaseId,
    })
  }

  const settleEntry = async (entryId: string, settledAt?: Date, paymentMethodId?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("financial_entries")
        .update({
          is_settled: true,
          settled_at: (settledAt || new Date()).toISOString(),
          settled_payment_method_id: paymentMethodId,
        })
        .eq("id", entryId)

      if (error) throw error

      await loadEntries()
      toast({
        title: "Sucesso",
        description: "Lançamento quitado com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error settling entry:", error)
      toast({
        title: "Erro",
        description: "Erro ao quitar lançamento",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    entries,
    loading,
    loadEntries,
    createEntry,
    createFromOrder,
    createFromPurchase,
    settleEntry,
  }
}