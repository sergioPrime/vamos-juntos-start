import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface AdminMetrics {
  totalOrganizations: number
  activeSubscriptions: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  userGrowth: {
    current: number
    previous: number
    percentage: number
  }
  revenueGrowth: {
    current: number
    previous: number
    percentage: number
  }
  planDistribution: {
    planName: string
    count: number
    revenue: number
  }[]
  recentOrganizations: {
    id: string
    name: string
    created_at: string
    plan_name: string
    status: string
    members_count: number
  }[]
  conversionRate: number
  churnRate: number
  averageRevenuePerUser: number
}

export function useAdminAnalytics() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch total organizations
      const { count: totalOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      if (orgsError) throw orgsError

      // Fetch active subscriptions
      const { data: activeSubsData, error: subsError } = await supabase
        .from('user_organizations')
        .select('subscription_plan_id, subscription_status')
        .eq('subscription_status', 'active')

      if (subsError) throw subsError

      // Fetch plan distribution with revenue
      const { data: planData, error: planError } = await supabase
        .from('user_organizations')
        .select(`
          subscription_plan_id,
          subscription_plans (
            name,
            price
          )
        `)
        .not('subscription_plan_id', 'is', null)

      if (planError) throw planError

      // Calculate plan distribution
      const planDistribution: Record<string, { count: number; revenue: number; name: string }> = {}
      
      planData?.forEach(item => {
        const plan = item.subscription_plans as any
        if (plan) {
          const planName = plan.name || 'Sem Plano'
          const planPrice = plan.price || 0
          
          if (!planDistribution[planName]) {
            planDistribution[planName] = { count: 0, revenue: 0, name: planName }
          }
          planDistribution[planName].count++
          planDistribution[planName].revenue += planPrice
        }
      })

      const planDistArray = Object.values(planDistribution).map(p => ({
        planName: p.name,
        count: p.count,
        revenue: p.revenue
      }))

      // Calculate total revenue
      const totalRevenue = planDistArray.reduce((sum, plan) => sum + plan.revenue, 0)
      const monthlyRecurringRevenue = totalRevenue

      // Fetch recent organizations
      const { data: recentOrgs, error: recentError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          user_organizations!inner (
            subscription_plan_id,
            subscription_status,
            subscription_plans (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentError) throw recentError

      // Format recent organizations
      const recentOrganizations = await Promise.all(
        (recentOrgs || []).map(async (org: any) => {
          const { count: membersCount } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)

          const firstUserOrg = org.user_organizations?.[0]
          const plan = firstUserOrg?.subscription_plans as any

          return {
            id: org.id,
            name: org.name,
            created_at: org.created_at,
            plan_name: plan?.name || 'Sem Plano',
            status: firstUserOrg?.subscription_status || 'inactive',
            members_count: membersCount || 0
          }
        })
      )

      // Calculate growth metrics (comparing last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const { count: currentPeriodOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { count: previousPeriodOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())

      const userGrowthPercentage = previousPeriodOrgs && previousPeriodOrgs > 0
        ? ((currentPeriodOrgs || 0) - previousPeriodOrgs) / previousPeriodOrgs * 100
        : 0

      // Calculate conversion and churn (simplified)
      const conversionRate = totalOrgs && totalOrgs > 0
        ? ((activeSubsData?.length || 0) / totalOrgs) * 100
        : 0

      const averageRevenuePerUser = (activeSubsData?.length || 0) > 0
        ? totalRevenue / (activeSubsData?.length || 1)
        : 0

      setMetrics({
        totalOrganizations: totalOrgs || 0,
        activeSubscriptions: activeSubsData?.length || 0,
        totalRevenue,
        monthlyRecurringRevenue,
        userGrowth: {
          current: currentPeriodOrgs || 0,
          previous: previousPeriodOrgs || 0,
          percentage: userGrowthPercentage
        },
        revenueGrowth: {
          current: totalRevenue,
          previous: totalRevenue * 0.9, // Simplified
          percentage: 10 // Simplified
        },
        planDistribution: planDistArray,
        recentOrganizations,
        conversionRate,
        churnRate: 5, // Simplified - needs real calculation
        averageRevenuePerUser
      })
    } catch (err) {
      console.error('Error fetching admin metrics:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  }
}
