import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"

interface FinancialMetrics {
  totalBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  pendingReceivables: number
  overdueAmount: number
  totalCustomers: number
  totalInvoices: number
  totalProducts: number
}

interface CashFlowData {
  date: string
  inflow: number
  outflow: number
  balance: number
}

interface CategoryData {
  category: string
  amount: number
  count: number
  color?: string
  [key: string]: any
}

export function useFinancialData() {
  const organization = useOrganization()
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalBalance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    pendingReceivables: 0,
    overdueAmount: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalProducts: 0
  })
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [revenueByCategory, setRevenueByCategory] = useState<CategoryData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadFinancialData()
    }
  }, [organization])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMetrics(),
        loadCashFlow(),
        loadCategoryData()
      ])
    } catch (error) {
      console.error("Error loading financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    if (!organization?.currentOrg?.id) return

    // Get bank accounts balance
    const { data: bankAccounts } = await supabase
      .from("bank_accounts")
      .select("balance")
      .eq("org_id", organization.currentOrg.id)
      .eq("is_active", true)

    const totalBalance = bankAccounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0

    // Get monthly revenue from paid invoices
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { data: monthlyInvoices } = await supabase
      .from("invoices")
      .select("total_amount")
      .eq("org_id", organization.currentOrg.id)
      .eq("status", "paid")
      .gte("paid_at", firstDayOfMonth.toISOString())

    const monthlyRevenue = monthlyInvoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0

    // Get pending receivables
    const { data: pendingInvoices } = await supabase
      .from("invoices")
      .select("total_amount, due_date")
      .eq("org_id", organization.currentOrg.id)
      .eq("status", "pending")

    const pendingReceivables = pendingInvoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0
    
    const today = new Date()
    const overdueAmount = pendingInvoices?.filter(invoice => 
      invoice.due_date && new Date(invoice.due_date) < today
    ).reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0

    // Get counts
    const [
      { count: totalCustomers },
      { count: totalInvoices },
      { count: totalProducts }
    ] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("org_id", organization.currentOrg.id),
      supabase.from("invoices").select("*", { count: "exact", head: true }).eq("org_id", organization.currentOrg.id),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("org_id", organization.currentOrg.id)
    ])

    setMetrics({
      totalBalance,
      monthlyRevenue,
      monthlyExpenses: 0, // Will be calculated from financial transactions when available
      pendingReceivables,
      overdueAmount,
      totalCustomers: totalCustomers || 0,
      totalInvoices: totalInvoices || 0,
      totalProducts: totalProducts || 0
    })
  }

  const loadCashFlow = async () => {
    if (!organization?.currentOrg?.id) return

    // Get financial transactions for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: transactions } = await supabase
      .from("financial_transactions")
      .select("transaction_date, amount, transaction_type")
      .eq("org_id", organization.currentOrg.id)
      .gte("transaction_date", sixMonthsAgo.toISOString().split('T')[0])
      .order("transaction_date", { ascending: true })

    if (!transactions?.length) {
      setCashFlowData([])
      return
    }

    // Group by month and calculate flow
    const monthlyData: { [key: string]: { inflow: number, outflow: number } } = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflow: 0, outflow: 0 }
      }
      
      const amount = Number(transaction.amount)
      if (transaction.transaction_type === 'inflow') {
        monthlyData[monthKey].inflow += amount
      } else {
        monthlyData[monthKey].outflow += amount
      }
    })

    let balance = 0
    const cashFlowArray = Object.entries(monthlyData).map(([monthKey, data]) => {
      balance += data.inflow - data.outflow
      return {
        date: monthKey,
        inflow: data.inflow,
        outflow: data.outflow,
        balance
      }
    })

    setCashFlowData(cashFlowArray)
  }

  const loadCategoryData = async () => {
    if (!organization?.currentOrg?.id) return

    // Revenue by product category from invoice items
    const { data: invoiceItems } = await supabase
      .from("invoice_items")
      .select(`
        total_price,
        invoices!inner(status, org_id)
      `)
      .eq("invoices.org_id", organization.currentOrg.id)
      .eq("invoices.status", "paid")

    // For now, group all as "Serviços" since we don't have category in invoice_items
    const totalRevenue = invoiceItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0
    
    setRevenueByCategory(totalRevenue > 0 ? [
      { category: "Serviços", amount: totalRevenue, count: invoiceItems?.length || 0, color: "hsl(var(--primary))" }
    ] : [])

    // Expenses from financial transactions
    const { data: expenseTransactions } = await supabase
      .from("financial_transactions")
      .select("amount, category")
      .eq("org_id", organization.currentOrg.id)
      .eq("transaction_type", "outflow")

    const expensesByCategory: { [key: string]: { amount: number, count: number } } = {}
    
    expenseTransactions?.forEach(transaction => {
      const category = transaction.category || "Outros"
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = { amount: 0, count: 0 }
      }
      expensesByCategory[category].amount += Number(transaction.amount)
      expensesByCategory[category].count += 1
    })

    const expensesArray = Object.entries(expensesByCategory).map(([category, data], index) => {
      const colors = ["hsl(var(--destructive))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"]
      return {
        category,
        amount: data.amount,
        count: data.count,
        color: colors[index % colors.length]
      }
    })

    setExpensesByCategory(expensesArray)
  }

  return {
    metrics,
    cashFlowData,
    revenueByCategory,
    expensesByCategory,
    loading,
    refreshData: loadFinancialData
  }
}