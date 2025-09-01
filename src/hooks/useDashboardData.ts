import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"

interface DashboardMetrics {
  currentBalance: number
  monthlyRevenue: number
  receivables: number
  recentActivities: Activity[]
}

interface Activity {
  id: string
  type: string
  description: string
  amount?: number
  date: string
}

export function useDashboardData() {
  const organization = useOrganization()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    currentBalance: 0,
    monthlyRevenue: 0,
    receivables: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadDashboardData()
    }
  }, [organization])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMetrics(),
        loadRecentActivities()
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    if (!organization?.currentOrg?.id) return

    // Get current balance from bank accounts
    const { data: bankAccounts } = await supabase
      .from("bank_accounts")
      .select("balance")
      .eq("org_id", organization.currentOrg.id)
      .eq("is_active", true)

    const currentBalance = bankAccounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0

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
      .select("total_amount")
      .eq("org_id", organization.currentOrg.id)
      .eq("status", "pending")

    const receivables = pendingInvoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0

    setMetrics(prev => ({
      ...prev,
      currentBalance,
      monthlyRevenue,
      receivables
    }))
  }

  const loadRecentActivities = async () => {
    if (!organization?.currentOrg?.id) return

    const activities: Activity[] = []

    // Get recent invoices
    const { data: recentInvoices } = await supabase
      .from("invoices")
      .select("id, title, total_amount, status, created_at")
      .eq("org_id", organization.currentOrg.id)
      .order("created_at", { ascending: false })
      .limit(5)

    recentInvoices?.forEach(invoice => {
      activities.push({
        id: invoice.id,
        type: "invoice",
        description: `Fatura criada: ${invoice.title}`,
        amount: Number(invoice.total_amount),
        date: invoice.created_at
      })
    })

    // Get recent customers
    const { data: recentCustomers } = await supabase
      .from("customers")
      .select("id, name, created_at")
      .eq("org_id", organization.currentOrg.id)
      .order("created_at", { ascending: false })
      .limit(3)

    recentCustomers?.forEach(customer => {
      activities.push({
        id: customer.id,
        type: "customer",
        description: `Cliente cadastrado: ${customer.name}`,
        date: customer.created_at
      })
    })

    // Get recent quotes
    const { data: recentQuotes } = await supabase
      .from("quotes")
      .select("id, title, total_amount, created_at")
      .eq("org_id", organization.currentOrg.id)
      .order("created_at", { ascending: false })
      .limit(3)

    recentQuotes?.forEach(quote => {
      activities.push({
        id: quote.id,
        type: "quote",
        description: `Orçamento criado: ${quote.title}`,
        amount: Number(quote.total_amount),
        date: quote.created_at
      })
    })

    // Sort all activities by date and take the most recent 10
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setMetrics(prev => ({
      ...prev,
      recentActivities: activities.slice(0, 10)
    }))
  }

  return {
    metrics,
    loading,
    refreshData: loadDashboardData
  }
}