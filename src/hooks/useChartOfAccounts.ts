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

// Default Brazilian Chart of Accounts
const defaultChartOfAccounts: Omit<CreateChartOfAccountData, 'org_id'>[] = [
  // ATIVO
  { account_code: "1", account_name: "ATIVO", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "1.1", account_name: "ATIVO CIRCULANTE", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "1.1.1", account_name: "Disponível", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "1.1.1.01", account_name: "Caixa", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "1.1.1.02", account_name: "Bancos c/ Movimento", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "1.1.2", account_name: "Direitos Realizáveis", account_type: "synthetic", nature_code: "01", is_expense: false },
  { account_code: "1.1.2.01", account_name: "Duplicatas a Receber", account_type: "analytic", nature_code: "01", is_expense: false },
  { account_code: "1.1.2.02", account_name: "Estoque", account_type: "analytic", nature_code: "01", is_expense: false },
  
  // PASSIVO
  { account_code: "2", account_name: "PASSIVO", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "2.1", account_name: "PASSIVO CIRCULANTE", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "2.1.1", account_name: "Obrigações", account_type: "synthetic", nature_code: "02", is_expense: false },
  { account_code: "2.1.1.01", account_name: "Fornecedores", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "2.1.1.02", account_name: "Salários a Pagar", account_type: "analytic", nature_code: "02", is_expense: false },
  { account_code: "2.1.1.03", account_name: "Impostos a Recolher", account_type: "analytic", nature_code: "02", is_expense: false },
  
  // PATRIMÔNIO LÍQUIDO
  { account_code: "3", account_name: "PATRIMÔNIO LÍQUIDO", account_type: "synthetic", nature_code: "03", is_expense: false },
  { account_code: "3.1", account_name: "Capital", account_type: "synthetic", nature_code: "03", is_expense: false },
  { account_code: "3.1.1.01", account_name: "Capital Social", account_type: "analytic", nature_code: "03", is_expense: false },
  { account_code: "3.2", account_name: "Reservas e Lucros", account_type: "synthetic", nature_code: "03", is_expense: false },
  { account_code: "3.2.1.01", account_name: "Lucros Acumulados", account_type: "analytic", nature_code: "03", is_expense: false },
  
  // RECEITAS
  { account_code: "4", account_name: "RECEITAS", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "4.1", account_name: "RECEITAS OPERACIONAIS", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "4.1.1", account_name: "Receita de Vendas", account_type: "synthetic", nature_code: "04", is_expense: false },
  { account_code: "4.1.1.01", account_name: "Vendas de Produtos", account_type: "analytic", nature_code: "04", is_expense: false },
  { account_code: "4.1.1.02", account_name: "Prestação de Serviços", account_type: "analytic", nature_code: "04", is_expense: false },
  
  // DESPESAS
  { account_code: "5", account_name: "DESPESAS", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "5.1", account_name: "DESPESAS OPERACIONAIS", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1", account_name: "Despesas Administrativas", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1.01", account_name: "Salários", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1.02", account_name: "Encargos Sociais", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1.03", account_name: "Aluguel", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1.04", account_name: "Energia Elétrica", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.1.05", account_name: "Telefone", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.2", account_name: "Despesas Comerciais", account_type: "synthetic", nature_code: "04", is_expense: true },
  { account_code: "5.1.2.01", account_name: "Comissões", account_type: "analytic", nature_code: "04", is_expense: true },
  { account_code: "5.1.2.02", account_name: "Propaganda e Marketing", account_type: "analytic", nature_code: "04", is_expense: true },
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
        .select("*")
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
      accountsMap.set(account.id, { ...account, children: [] as ChartOfAccount[] })
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

    try {
      const { error } = await supabase
        .from("chart_of_accounts")
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

    try {
      const { error } = await supabase
        .from("chart_of_accounts")
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