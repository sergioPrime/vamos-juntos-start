import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

interface TimeSeriesData {
  date: string
  value: number
}

interface ModuleActivity {
  module: string
  count: number
}

interface AnalyticsData {
  userGrowth: TimeSeriesData[]
  revenueGrowth: TimeSeriesData[]
  moduleActivity: ModuleActivity[]
  conversionRate: number
  averageLifetime: number
  activeOrganizations: number
}

export function useAdminAnalytics(days: number = 30) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    revenueGrowth: [],
    moduleActivity: [],
    conversionRate: 0,
    averageLifetime: 0,
    activeOrganizations: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // User growth over time
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true })

      const userGrowth = aggregateByDate(profiles || [], "created_at")

      // Revenue growth (from financial entries)
      const { data: entries } = await supabase
        .from("financial_entries")
        .select("created_at, amount")
        .eq("entry_type", "receita")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true })

      const revenueGrowth = aggregateRevenueByDate(entries || [])

      // Module activity (from audit trail)
      const { data: auditLogs } = await supabase
        .from("audit_trail")
        .select("entity_type")
        .gte("event_timestamp", startDate.toISOString())

      const moduleActivity = aggregateByModule(auditLogs || [])

      // Active organizations
      const { data: orgs } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("subscription_status", "active")

      const activeOrganizations = new Set(orgs?.map(o => o.org_id) || []).size

      // Conversion rate (organizations with paid plans)
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id")

      const { data: paidOrgs } = await supabase
        .from("user_organizations")
        .select("org_id")
        .in("subscription_status", ["active", "trialing"])

      const conversionRate = allOrgs && paidOrgs 
        ? (new Set(paidOrgs.map(o => o.org_id)).size / allOrgs.length) * 100 
        : 0

      // Average lifetime (days since first org creation)
      const { data: oldestOrg } = await supabase
        .from("organizations")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)

      const averageLifetime = oldestOrg?.[0] 
        ? Math.floor((Date.now() - new Date(oldestOrg[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setAnalytics({
        userGrowth,
        revenueGrowth,
        moduleActivity,
        conversionRate: Math.round(conversionRate * 10) / 10,
        averageLifetime,
        activeOrganizations
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const aggregateByDate = (data: any[], dateField: string): TimeSeriesData[] => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([date, value]) => ({ date, value: value as number }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const aggregateRevenueByDate = (data: any[]): TimeSeriesData[] => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + Number(item.amount)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([date, value]) => ({ date, value: value as number }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const aggregateByModule = (data: any[]): ModuleActivity[] => {
    const grouped = data.reduce((acc, item) => {
      const module = item.entity_type || "outros"
      acc[module] = (acc[module] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([module, count]) => ({ module, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10)
  }

  return { analytics, loading, refreshAnalytics: loadAnalytics }
}
