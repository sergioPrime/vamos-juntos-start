import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"
import { useToast } from "@/hooks/use-toast"

export interface FinancialEntry {
  id: string
  entry_code?: number
  org_id: string
  company_id?: string
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  person_id: string
  chart_of_account_id?: string
  cost_center_id?: string
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
  companies?: { name: string }
  customers?: { name: string }
  suppliers?: { name: string }
  chart_of_accounts?: { account_code: string; account_name: string }
  cost_centers?: { code: string; name: string }
  payment_methods?: { name: string }
  bank_accounts?: { bank_name: string; account_number: string; bank_code?: string; agency?: string; agency_digit?: string; account_digit?: string }
}

export interface CreateFinancialEntryData {
  entry_type: "receivable" | "payable"
  person_id: string
  chart_of_account_id?: string
  cost_center_id?: string
  amount: number
  due_date: string
  competence_date?: string
  description?: string
  origin_type?: "order" | "purchase" | "manual"
  origin_id?: string
  company_id?: string
  payment_method_id?: string
  bank_account_id?: string
}

export interface CreateFinancialEntryDataRequired {
  entry_type: "receivable" | "payable"
  person_id: string
  chart_of_account_id: string
  cost_center_id: string
  amount: number
  due_date: string
  competence_date?: string
  description?: string
  origin_type?: "order" | "purchase" | "manual"
  origin_id?: string
  company_id?: string
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
      
      // First, try a simple query without any joins to isolate the issue
      console.log("Attempting to load financial entries for org:", organization.currentOrg.id)
      
      const { data, error } = await supabase
        .from("financial_entries")
        .select("*")
        .eq("org_id", organization.currentOrg.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Financial entries query error:", error)
        throw error
      }
      
      console.log("Raw financial entries data:", data)
      
      // If we have data, enrich it manually with related information
      const enrichedEntries = await Promise.all((data || []).map(async (entry: any) => {
        const enrichedEntry = { ...entry }
        
        // Fetch related data separately to avoid join issues
        if (entry.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', entry.company_id)
            .maybeSingle();
          enrichedEntry.companies = company;
        }
        
        if (entry.chart_of_account_id) {
          const { data: chartAccount } = await supabase
            .from('chart_of_accounts')
            .select('account_code, account_name')
            .eq('id', entry.chart_of_account_id)
            .maybeSingle();
          enrichedEntry.chart_of_accounts = chartAccount;
        }
        
        if (entry.cost_center_id) {
          const { data: costCenter } = await supabase
            .from('cost_centers')
            .select('code, name')
            .eq('id', entry.cost_center_id)
            .maybeSingle();
          enrichedEntry.cost_centers = costCenter;
        }
        
        if (entry.payment_method_id) {
          const { data: paymentMethod } = await supabase
            .from('payment_methods')
            .select('name')
            .eq('id', entry.payment_method_id)
            .maybeSingle();
          enrichedEntry.payment_methods = paymentMethod;
        }
        
        if (entry.bank_account_id) {
          const { data: bankAccount } = await supabase
            .from('bank_accounts')
            .select('bank_name, account_number, bank_code, agency, agency_digit, account_digit')
            .eq('id', entry.bank_account_id)
            .maybeSingle();
          enrichedEntry.bank_accounts = bankAccount;
        }
        
        // Fetch customer or supplier name
        if (entry.person_type === 'customer') {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', entry.person_id)
            .maybeSingle();
          enrichedEntry.customers = customer;
        } else if (entry.person_type === 'supplier') {
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('name')
            .eq('id', entry.person_id)
            .maybeSingle();
          enrichedEntry.suppliers = supplier;
        }
        
        return enrichedEntry;
      }));

      console.log("Enriched financial entries:", enrichedEntries)
      setEntries(enrichedEntries as any)
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

  const createEntry = async (data: CreateFinancialEntryDataRequired): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    // Validate required fields
    if (!data.chart_of_account_id) {
      toast({
        title: "Erro",
        description: "Plano de conta é obrigatório",
        variant: "destructive",
      })
      return false
    }

    if (!data.cost_center_id) {
      toast({
        title: "Erro",
        description: "Centro de custo é obrigatório",
        variant: "destructive",
      })
      return false
    }

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
      toast({
        title: "Sucesso",
        description: "Lançamento criado com sucesso",
      })
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

  const createFromOrder = async (orderId: string, customerId: string, amount: number, dueDate?: string, chartOfAccountId?: string, costCenterId?: string): Promise<boolean> => {
    if (!chartOfAccountId || !costCenterId) {
      toast({
        title: "Erro",
        description: "Plano de conta e centro de custo são obrigatórios",
        variant: "destructive",
      })
      return false
    }

    const calculatedDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return createEntry({
      entry_type: "receivable",
      person_id: customerId,
      chart_of_account_id: chartOfAccountId,
      cost_center_id: costCenterId,
      amount,
      due_date: calculatedDueDate,
      description: `Conta a receber - Pedido`,
      origin_type: "order",
      origin_id: orderId,
    })
  }

  const createFromPurchase = async (purchaseId: string, supplierId: string, amount: number, dueDate?: string, chartOfAccountId?: string, costCenterId?: string): Promise<boolean> => {
    if (!chartOfAccountId || !costCenterId) {
      toast({
        title: "Erro",
        description: "Plano de conta e centro de custo são obrigatórios",
        variant: "destructive",
      })
      return false
    }

    const calculatedDueDate = dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return createEntry({
      entry_type: "payable",
      person_id: supplierId,
      chart_of_account_id: chartOfAccountId,
      cost_center_id: costCenterId,
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