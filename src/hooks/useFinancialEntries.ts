import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"
import { useAuth } from "./useAuth"
import { useToast } from "@/hooks/use-toast"
import { validateCreateEntry } from "@/schemas/financialEntries"
import { z } from "zod"

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
  entry_date?: Date // Data de lançamento personalizada
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
  entry_date?: Date // Data de lançamento personalizada
  description?: string
  origin_type?: "order" | "purchase" | "manual"
  origin_id?: string
  company_id?: string
  payment_method_id?: string
  bank_account_id?: string
}

export function useFinancialEntries() {
  const organization = useOrganization()
  const { user } = useAuth()
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
      
      // Separar IDs de pessoas por tipo
      const customerIds = [...new Set(data.filter(e => e.person_type === 'customer').map(e => e.person_id).filter(Boolean))]
      const supplierIds = [...new Set(data.filter(e => e.person_type === 'supplier').map(e => e.person_id).filter(Boolean))]
      const pessoaIds = [...new Set(data.map(e => e.person_id).filter(Boolean))]
      
      // Coletar IDs de pedidos (orders) quando origin_type for 'order'
      const orderIds = [...new Set(data.filter(e => e.origin_type === 'order' && e.origin_id).map(e => e.origin_id).filter(Boolean))]

      // Buscar todos os dados relacionados em paralelo
      const [
        companiesData,
        chartOfAccountsData,
        costCentersData,
        paymentMethodsData,
        bankAccountsData,
        customersData,
        suppliersData,
        pessoasData,
        ordersData
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
          : Promise.resolve({ data: [] }),
        pessoaIds.length > 0
          ? supabase.from('pessoas').select('id, nome_fantasia, razao_social, rotulos').in('id', pessoaIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('orders').select('id, order_number').in('id', orderIds)
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
      const ordersMap = new Map(
        ordersData.data?.map(o => [o.id, o] as const) || []
      )
      
      // Criar mapa combinado de clientes (customers table e pessoas table)
      const customersMap = new Map(
        customersData.data?.map(c => [c.id, { ...c, name: c.name }] as const) || []
      )
      
      // Criar mapa combinado de fornecedores (suppliers table e pessoas table)
      const suppliersMap = new Map(
        suppliersData.data?.map(s => [s.id, { ...s, name: s.name }] as const) || []
      )
      
      // Adicionar pessoas ao mapa apropriado baseado nos rótulos
      pessoasData.data?.forEach(p => {
        const pessoaData = { ...p, name: p.nome_fantasia || p.razao_social || 'Sem nome' }
        const rotulos = p.rotulos || []
        
        // Verifica se tem o rótulo "Cliente" ou "Fornecedor"
        if (rotulos.includes('Cliente')) {
          customersMap.set(p.id, pessoaData)
        }
        if (rotulos.includes('Fornecedor')) {
          suppliersMap.set(p.id, pessoaData)
        }
      })

      // Enriquecer dados com todas as informações relacionadas
      const enrichedData = data.map(entry => {
        const customer = entry.person_type === 'customer' && entry.person_id ? customersMap.get(entry.person_id) : null
        const supplier = entry.person_type === 'supplier' && entry.person_id ? suppliersMap.get(entry.person_id) : null
        
        return {
          ...entry,
          companies: entry.company_id ? companiesMap.get(entry.company_id) : null,
          chart_of_accounts: entry.chart_of_account_id ? chartOfAccountsMap.get(entry.chart_of_account_id) : null,
          cost_centers: entry.cost_center_id ? costCentersMap.get(entry.cost_center_id) : null,
          payment_methods: entry.payment_method_id ? paymentMethodsMap.get(entry.payment_method_id) : null,
          bank_accounts: entry.bank_account_id ? bankAccountsMap.get(entry.bank_account_id) : null,
          customers: customer,
          suppliers: supplier,
          orders: entry.origin_type === 'order' && entry.origin_id ? ordersMap.get(entry.origin_id) : null
        }
      })

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

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      })
      return false
    }

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
      // Prepare data for validation
      const dataToValidate = {
        org_id: organization.currentOrg.id,
        company_id: data.company_id,
        person_id: data.person_id,
        person_type: data.entry_type === "receivable" ? ("customer" as const) : ("supplier" as const),
        entry_type: data.entry_type,
        chart_of_account_id: data.chart_of_account_id,
        cost_center_id: data.cost_center_id,
        amount: data.amount,
        competence_date: data.competence_date || data.due_date,
        due_date: data.due_date,
        description: data.description,
        origin_type: data.origin_type,
        origin_id: data.origin_id,
        payment_method_id: data.payment_method_id,
        bank_account_id: data.bank_account_id,
        created_by: user.id,
        is_settled: false,
      }

      // Validate data using Zod schema
      const validatedData = validateCreateEntry(dataToValidate)

      // Convert Date objects to ISO strings for Supabase
      const dataForSupabase = {
        org_id: validatedData.org_id,
        company_id: validatedData.company_id,
        person_id: validatedData.person_id,
        person_type: validatedData.person_type,
        entry_type: validatedData.entry_type,
        chart_of_account_id: validatedData.chart_of_account_id,
        cost_center_id: validatedData.cost_center_id,
        amount: validatedData.amount,
        competence_date: validatedData.competence_date instanceof Date 
          ? validatedData.competence_date.toISOString() 
          : validatedData.competence_date,
        due_date: validatedData.due_date instanceof Date 
          ? validatedData.due_date.toISOString() 
          : validatedData.due_date,
        description: validatedData.description,
        origin_type: validatedData.origin_type,
        origin_id: validatedData.origin_id,
        payment_method_id: validatedData.payment_method_id,
        bank_account_id: validatedData.bank_account_id,
        created_by: validatedData.created_by,
        is_settled: validatedData.is_settled,
        is_conciliated: validatedData.is_conciliated || false,
      }

      // Se entry_date for fornecida e for diferente de hoje, usar como created_at
      const finalData = data.entry_date && 
        new Date(data.entry_date).toDateString() !== new Date().toDateString()
        ? {
            ...dataForSupabase,
            created_at: data.entry_date instanceof Date 
              ? data.entry_date.toISOString() 
              : new Date(data.entry_date).toISOString()
          }
        : dataForSupabase

      const { error } = await supabase
        .from("financial_entries")
        .insert([finalData])

      if (error) throw error

      await loadEntries()
      toast({
        title: "Sucesso",
        description: "Lançamento criado com sucesso",
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        toast({
          title: "Dados inválidos",
          description: errorMessages,
          variant: "destructive",
        })
      } else if (error && typeof error === 'object' && 'message' in error) {
        toast({
          title: "Erro",
          description: `Erro ao criar lançamento: ${(error as any).message}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar lançamento financeiro",
          variant: "destructive",
        })
      }
      console.error("Erro detalhado ao criar entry:", error)
      return false
    }
  }

  const createFromOrder = async (orderId: string, customerId: string, amount: number, dueDate?: string, chartOfAccountId?: string, costCenterId?: string, paymentMethod?: string): Promise<boolean> => {
    if (!chartOfAccountId || !costCenterId) {
      toast({
        title: "Erro",
        description: "Plano de conta e centro de custo são obrigatórios",
        variant: "destructive",
      })
      return false
    }

    // Calcular data de vencimento baseado no método de pagamento
    let calculatedDueDate = dueDate
    if (!calculatedDueDate && paymentMethod) {
      const paymentMethodLower = paymentMethod.toLowerCase()
      const today = new Date()
      
      if (paymentMethodLower.includes('débito')) {
        // Cartão de débito: vencimento D+1
        today.setDate(today.getDate() + 1)
        calculatedDueDate = today.toISOString().split('T')[0]
      } else if (paymentMethodLower.includes('crédito')) {
        // Cartão de crédito: vencimento D+30
        today.setDate(today.getDate() + 30)
        calculatedDueDate = today.toISOString().split('T')[0]
      } else {
        // Outros métodos: data atual
        calculatedDueDate = today.toISOString().split('T')[0]
      }
    } else if (!calculatedDueDate) {
      // Fallback: D+7
      calculatedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
    
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