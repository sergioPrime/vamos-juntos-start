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
  cost_centers?: { id: string; code: string; name: string }[]
}

export interface CreateChartOfAccountData {
  account_code: string
  account_name: string
  account_type: "analytic" | "synthetic"
  nature_code: string
  is_expense: boolean
  parent_id?: string
  description?: string
  cost_center_ids?: string[]
}

// Default Brazilian Chart of Accounts
const defaultChartOfAccounts: Omit<CreateChartOfAccountData, 'org_id'>[] = [
  // 1 • RECEITAS
  { account_code: "1", account_name: "RECEITAS", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "1.1", account_name: "Receitas Operacionais", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "1.1.1", account_name: "Vendas de Produtos", account_type: "analytic", nature_code: "04", is_expense: false },
  { account_code: "1.1.2", account_name: "Prestação de Serviços", account_type: "analytic", nature_code: "04", is_expense: false },
  { account_code: "1.2", account_name: "Receitas Não Operacionais", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "1.2.1", account_name: "Receitas Financeiras", account_type: "analytic", nature_code: "04", is_expense: false },
  { account_code: "1.2.2", account_name: "Ganhos na Venda de Ativos", account_type: "analytic", nature_code: "04", is_expense: false },

  // 2 • DESPESAS
  { account_code: "2", account_name: "DESPESAS", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "2.1", account_name: "Despesas Operacionais", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "2.1.1", account_name: "Custo dos Produtos Vendidos", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "2.1.2", account_name: "Despesas com Pessoal", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "2.1.3", account_name: "Despesas Administrativas", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "2.2", account_name: "Despesas Não Operacionais", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "2.2.1", account_name: "Perdas Financeiras", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "2.2.2", account_name: "Despesas Extraordinárias", account_type: "analytic", nature_code: "04", is_expense: true },

  // 3 • ATIVOS
  { account_code: "3", account_name: "ATIVOS", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "3.1", account_name: "Ativo Circulante", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "3.1.1", account_name: "Caixa", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.1.2", account_name: "Bancos com Movimento", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.1.3", account_name: "Clientes", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.1.4", account_name: "Estoques", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.2", account_name: "Ativo Não Circulante", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "3.2.1", account_name: "Investimentos", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.2.2", account_name: "Imobilizado", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "3.2.2.1", account_name: "Máquinas", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.2.2.2", account_name: "Edifícios", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "3.2.3", account_name: "Intangível", account_type: "analytic", nature_code: "01", is_expense: false },

  // 4 • PASSIVOS
  { account_code: "4", account_name: "PASSIVOS", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "4.1", account_name: "Passivo Circulante", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "4.1.1", account_name: "Fornecedores", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "4.1.2", account_name: "Empréstimos de Curto Prazo", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "4.1.3", account_name: "Obrigações Fiscais", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "4.2", account_name: "Passivo Não Circulante", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "4.2.1", account_name: "Empréstimos de Longo Prazo", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "4.2.2", account_name: "Provisões", account_type: "analytic", nature_code: "02", is_expense: false },

  // 5 • PATRIMÔNIO LÍQUIDO
  { account_code: "5", account_name: "PATRIMÔNIO LÍQUIDO", account_type: "synthetic", nature_code: "03", is_expense: false },
  { account_code: "5.1", account_name: "Capital Social", account_type: "analytic", nature_code: "03", is_expense: false },
  { account_code: "5.2", account_name: "Reservas", account_type: "analytic", nature_code: "03", is_expense: false },
]

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

  const createDefaultAccounts = async (): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    try {
      // Create accounts with proper hierarchy
      const accountsMap = new Map<string, string>() // code -> id mapping
      
      for (const accountData of defaultChartOfAccounts) {
        // Find parent_id based on account_code hierarchy
        let parent_id: string | undefined
        
        // If account code has a parent (e.g., "1.1" has parent "1")
        const codeParts = accountData.account_code.split('.')
        if (codeParts.length > 1) {
          const parentCode = codeParts.slice(0, -1).join('.')
          parent_id = accountsMap.get(parentCode)
        }

        const { data: insertedData, error } = await supabase
          .from("chart_of_accounts")
          .insert([{
            ...accountData,
            org_id: organization.currentOrg.id,
            parent_id,
          }])
          .select()
          .single()

        if (error) throw error
        
        // Store the mapping for child accounts
        if (insertedData) {
          accountsMap.set(accountData.account_code, insertedData.id)
        }
      }

      return true
    } catch (error) {
      console.error("Error creating default accounts:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar plano de contas padrão",
        variant: "destructive",
      })
      return false
    }
  }

  const loadAccounts = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select(`
          *,
          chart_account_cost_centers(
            cost_center_id,
            cost_centers(id, code, name)
          )
        `)
        .eq("org_id", organization.currentOrg.id)
        .eq("is_active", true)
        .order("account_code", { ascending: true })

      if (error) throw error
      
      // If no accounts exist, create default ones
      if (!data || data.length === 0) {
        const defaultCreated = await createDefaultAccounts()
        if (defaultCreated) {
          // Reload accounts after creating defaults
          const { data: newData, error: newError } = await supabase
            .from("chart_of_accounts")
            .select("*")
            .eq("org_id", organization.currentOrg.id)
            .eq("is_active", true)
            .order("account_code", { ascending: true })
          
          if (newError) throw newError
          buildAccountHierarchy(newData as any)
        }
      } else {
        buildAccountHierarchy(data as any)
      }
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

  const buildAccountHierarchy = (data: any[]) => {
    // Build hierarchical structure
    const accountsMap = new Map<string, ChartOfAccount>()
    const rootAccounts = [] as ChartOfAccount[]

    // First pass: create map of all accounts
    data?.forEach((account: any) => {
      const costCenters = account.chart_account_cost_centers?.map((cacc: any) => cacc.cost_centers) || []
      accountsMap.set(account.id, { ...account, children: [] as ChartOfAccount[], cost_centers: costCenters })
    })

    // Second pass: build hierarchy
    data?.forEach((account: any) => {
      const accountWithChildren = accountsMap.get(account.id)!
      if (account.parent_id && accountsMap.has(account.parent_id)) {
        const parent = accountsMap.get(account.parent_id)!
        parent.children!.push(accountWithChildren)
      } else {
        rootAccounts.push(accountWithChildren)
      }
    })

    setAccounts(rootAccounts)
  }

  const validateAccountCode = (accountCode: string, parentId?: string): boolean => {
    // Basic validation for hierarchical codes
    const codeParts = accountCode.split('.')
    
    // If has parent, validate hierarchy
    if (parentId) {
      const parentAccount = findAccountById(parentId, accounts)
      if (parentAccount) {
        const parentParts = parentAccount.account_code.split('.')
        // New account should have one more level than parent
        if (codeParts.length !== parentParts.length + 1) {
          return false
        }
        // Parent code should be prefix of new code
        const expectedPrefix = parentParts.join('.')
        const actualPrefix = codeParts.slice(0, -1).join('.')
        return expectedPrefix === actualPrefix
      }
    }
    
    return true
  }

  const findAccountById = (id: string, accountList: ChartOfAccount[]): ChartOfAccount | null => {
    for (const account of accountList) {
      if (account.id === id) return account
      if (account.children) {
        const found = findAccountById(id, account.children)
        if (found) return found
      }
    }
    return null
  }

  const createAccount = async (data: CreateChartOfAccountData): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    // Validate account code hierarchy
    if (!validateAccountCode(data.account_code, data.parent_id)) {
      toast({
        title: "Erro",
        description: "Código da conta não respeita a hierarquia",
        variant: "destructive",
      })
      return false
    }

    // Validate cost centers are only associated with analytic accounts
    if (data.cost_center_ids && data.cost_center_ids.length > 0 && data.account_type !== "analytic") {
      toast({
        title: "Erro",
        description: "Apenas contas analíticas podem ter centros de custo associados",
        variant: "destructive",
      })
      return false
    }

    try {
      const { cost_center_ids, ...accountData } = data
      
      // Transform empty string parent_id to null
      const insertData = {
        account_code: accountData.account_code,
        account_name: accountData.account_name,
        account_type: accountData.account_type,
        nature_code: accountData.nature_code,
        description: accountData.description,
        is_expense: accountData.is_expense,
        parent_id: accountData.parent_id === "" ? null : accountData.parent_id,
        org_id: organization.currentOrg.id,
      }

      const { data: insertedAccount, error } = await supabase
        .from("chart_of_accounts")
        .insert([insertData])
        .select()
        .single()

      if (error) throw error

      // Associate cost centers if provided (only for analytic accounts)
      if (cost_center_ids && cost_center_ids.length > 0 && insertedAccount && accountData.account_type === "analytic") {
        // Process associations in a single transaction for better integrity
        const { error: associationError } = await supabase
          .from("chart_account_cost_centers")
          .insert(
            cost_center_ids.map(costCenterId => ({
              chart_of_account_id: insertedAccount.id,
              cost_center_id: costCenterId
            }))
          )

        if (associationError) throw associationError
      }

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
    // Validate account code hierarchy if changing code or parent
    if (data.account_code || data.parent_id !== undefined) {
      const currentAccount = findAccountById(id, accounts)
      if (currentAccount) {
        const newCode = data.account_code || currentAccount.account_code
        const newParentId = data.parent_id !== undefined ? data.parent_id : currentAccount.parent_id
        
        if (!validateAccountCode(newCode, newParentId)) {
          toast({
            title: "Erro",
            description: "Código da conta não respeita a hierarquia",
            variant: "destructive",
          })
          return false
        }
      }
    }

    // Validate cost centers are only associated with analytic accounts
    if (data.cost_center_ids && data.cost_center_ids.length > 0 && data.account_type === "synthetic") {
      toast({
        title: "Erro",
        description: "Apenas contas analíticas podem ter centros de custo associados",
        variant: "destructive",
      })
      return false
    }

    try {
      const { cost_center_ids, ...accountData } = data
      
      // Transform empty string parent_id to null
      const updateData = {
        ...accountData,
        parent_id: accountData.parent_id === "" ? null : accountData.parent_id
      }
      
      const { error } = await supabase
        .from("chart_of_accounts")
        .update(updateData)
        .eq("id", id)

      if (error) throw error

      // Update cost center associations if provided
      if (cost_center_ids !== undefined) {
        // Check if the account is analytic to allow associations
        const currentAccount = findAccountById(id, accounts)
        const finalAccountType = updateData.account_type || currentAccount?.account_type
        
        if (finalAccountType === "analytic" && cost_center_ids.length > 0) {
          // Remove existing associations first
          await supabase
            .from("chart_account_cost_centers")
            .delete()
            .eq("chart_of_account_id", id)

          // Add new associations
          const { error: associationError } = await supabase
            .from("chart_account_cost_centers")
            .insert(
              cost_center_ids.map(costCenterId => ({
                chart_of_account_id: id,
                cost_center_id: costCenterId
              }))
            )

          if (associationError) throw associationError
        } else if (finalAccountType === "synthetic") {
          // If account is becoming synthetic, remove all associations
          await supabase
            .from("chart_account_cost_centers")
            .delete()
            .eq("chart_of_account_id", id)
        }
      }

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
        .from("chart_of_accounts")
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