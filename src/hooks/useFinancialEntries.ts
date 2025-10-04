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
      
      console.log("Loading financial entries for org:", organization.currentOrg.id)
      
      // Primeira query: buscar lançamentos sem joins problemáticos
      const { data, error } = await supabase
        .from("financial_entries")
        .select("*")
        .eq("org_id", organization.currentOrg.id)
        .order("entry_code", { ascending: false })

      if (error) {
        console.error("Financial entries query error:", error)
        throw error
      }
      
      if (!data || data.length === 0) {
        setEntries([])
        return
      }

      // Coletar IDs únicos para buscar dados relacionados
      const companyIds = [...new Set(data.map(e => e.company_id).filter(Boolean))]
      const chartOfAccountIds = [...new Set(data.map(e => e.chart_of_account_id).filter(Boolean))]
      const costCenterIds = [...new Set(data.map(e => e.cost_center_id).filter(Boolean))]
      const paymentMethodIds = [...new Set(data.map(e => e.payment_method_id).filter(Boolean))]
      const bankAccountIds = [...new Set(data.map(e => e.bank_account_id).filter(Boolean))]
      const customerIds = data
        .filter(e => e.person_type === 'customer')
        .map(e => e.person_id)
        .filter(Boolean)
      const supplierIds = data
        .filter(e => e.person_type === 'supplier')
        .map(e => e.person_id)
        .filter(Boolean)

      // Buscar todos os dados relacionados em paralelo
      const [
        companiesData,
        chartOfAccountsData,
        costCentersData,
        paymentMethodsData,
        bankAccountsData,
        customersData,
        suppliersData
      ] = await Promise.all([
        companyIds.length > 0
          ? supabase.from('companies').select('id, name').in('id', companyIds)
          : Promise.resolve({ data: [] }),
        chartOfAccountIds.length > 0
          ? supabase.from('chart_of_accounts').select('id, account_code, account_name').in('id', chartOfAccountIds)
          : Promise.resolve({ data: [] }),
        costCenterIds.length > 0
          ? supabase.from('cost_centers').select('id, code, name').in('id', costCenterIds)
          : Promise.resolve({ data: [] }),
        paymentMethodIds.length > 0
          ? supabase.from('payment_methods').select('id, name').in('id', paymentMethodIds)
          : Promise.resolve({ data: [] }),
        bankAccountIds.length > 0
          ? supabase.from('bank_accounts').select('id, bank_name, account_number, bank_code, agency, agency_digit, account_digit').in('id', bankAccountIds)
          : Promise.resolve({ data: [] }),
        customerIds.length > 0
          ? supabase.from('customers').select('id, name').in('id', customerIds)
          : Promise.resolve({ data: [] }),
        supplierIds.length > 0
          ? supabase.from('suppliers').select('id, name').in('id', supplierIds)
          : Promise.resolve({ data: [] })
      ])

      // Criar mapas para lookup rápido
      const companiesMap = new Map(
        companiesData.data?.map(c => [c.id, c] as const) || []
      )
      const chartOfAccountsMap = new Map(
        chartOfAccountsData.data?.map(c => [c.id, c] as const) || []
      )
      const costCentersMap = new Map(
        costCentersData.data?.map(c => [c.id, c] as const) || []
      )
      const paymentMethodsMap = new Map(
        paymentMethodsData.data?.map(p => [p.id, p] as const) || []
      )
      const bankAccountsMap = new Map(
        bankAccountsData.data?.map(b => [b.id, b] as const) || []
      )
      const customersMap = new Map(
        customersData.data?.map(c => [c.id, c] as const) || []
      )
      const suppliersMap = new Map(
        suppliersData.data?.map(s => [s.id, s] as const) || []
      )

      // Enriquecer dados com todas as informações relacionadas
      const enrichedData = data.map(entry => ({
        ...entry,
        companies: entry.company_id ? companiesMap.get(entry.company_id) : null,
        chart_of_accounts: entry.chart_of_account_id ? chartOfAccountsMap.get(entry.chart_of_account_id) : null,
        cost_centers: entry.cost_center_id ? costCentersMap.get(entry.cost_center_id) : null,
        payment_methods: entry.payment_method_id ? paymentMethodsMap.get(entry.payment_method_id) : null,
        bank_accounts: entry.bank_account_id ? bankAccountsMap.get(entry.bank_account_id) : null,
        customers: entry.person_type === 'customer' ? customersMap.get(entry.person_id) : null,
        suppliers: entry.person_type === 'supplier' ? suppliersMap.get(entry.person_id) : null
      }))

      console.log("Loaded and enriched financial entries:", enrichedData)
      setEntries(enrichedData as any)
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