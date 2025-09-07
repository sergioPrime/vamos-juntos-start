import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"
import { useToast } from "@/hooks/use-toast"

export interface ChartOfAccount {
  id: string
  org_id: string
  account_code: string
  account_name: string
  account_type: "analytic" | "synthetic"
  nature_code: string
  is_expense: boolean
  is_active: boolean
  parent_id?: string
  description?: string
  created_at: string
  updated_at: string
  children?: ChartOfAccount[]
}

export interface CreateChartOfAccountData {
  account_code: string
  account_name: string
  account_type: "analytic" | "synthetic"
  nature_code: string
  is_expense: boolean
  parent_id?: string
  description?: string
}

export function useChartOfAccounts() {
  const organization = useOrganization()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadAccounts()
    }
  }, [organization])

  const loadAccounts = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("chart_of_accounts" as any)
        .select("*")
        .eq("org_id", organization.currentOrg.id)
        .eq("is_active", true)
        .order("account_code", { ascending: true })

      if (error) throw error
      
      // Build hierarchical structure
      const accountsMap = new Map<string, ChartOfAccount>()
      const rootAccounts = [] as ChartOfAccount[]

      // First pass: create map of all accounts
      (data as any)?.forEach((account: any) => {
        accountsMap.set(account.id, { ...account, children: [] as ChartOfAccount[] })
      })

      // Second pass: build hierarchy
      (data as any)?.forEach((account: any) => {
        const accountWithChildren = accountsMap.get(account.id)!
        if (account.parent_id && accountsMap.has(account.parent_id)) {
          const parent = accountsMap.get(account.parent_id)!
          parent.children!.push(accountWithChildren)
        } else {
          rootAccounts.push(accountWithChildren)
        }
      })

      setAccounts(rootAccounts)
    } catch (error) {
      console.error("Error loading chart of accounts:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar plano de contas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createAccount = async (data: CreateChartOfAccountData): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .insert([{
          ...data,
          org_id: organization.currentOrg.id,
        }])

      if (error) throw error

      await loadAccounts()
      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar conta",
        variant: "destructive",
      })
      return false
    }
  }

  const updateAccount = async (id: string, data: Partial<CreateChartOfAccountData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .update(data)
        .eq("id", id)

      if (error) throw error

      await loadAccounts()
      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error updating account:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .update({ is_active: false })
        .eq("id", id)

      if (error) throw error

      await loadAccounts()
      toast({
        title: "Sucesso",
        description: "Conta desativada com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Erro",
        description: "Erro ao desativar conta",
        variant: "destructive",
      })
      return false
    }
  }

  const getAnalyticAccounts = (): ChartOfAccount[] => {
    const collectAnalytic = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
      let result: ChartOfAccount[] = []
      accounts.forEach(account => {
        if (account.account_type === "analytic") {
          result.push(account)
        }
        if (account.children && account.children.length > 0) {
          result = result.concat(collectAnalytic(account.children))
        }
      })
      return result
    }
    return collectAnalytic(accounts)
  }

  return {
    accounts,
    loading,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAnalyticAccounts,
  }
}