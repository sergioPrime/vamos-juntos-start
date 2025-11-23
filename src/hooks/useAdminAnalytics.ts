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

      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      const { data: activeSubsData } = await supabase
        .from('user_organizations')
        .select('subscription_plan_id, subscription_status')
        .eq('subscription_status', 'active')

      const { data: planData } = await supabase
        .from('user_organizations')
        .select(`subscription_plan_id, subscription_plans (name, price)`)
        .not('subscription_plan_id', 'is', null)

      const planDistribution: Record<string, { count: number; revenue: number; name: string }> = {}
      
      planData?.forEach(item => {
        const plan = item.subscription_plans as any
        if (plan) {
          const planName = plan.name || 'Sem Plano'
          if (!planDistribution[planName]) {
            planDistribution[planName] = { count: 0, revenue: 0, name: planName }
          }
          planDistribution[planName].count++
          planDistribution[planName].revenue += plan.price || 0
        }
      })

      const planDistArray = Object.values(planDistribution).map(p => ({
        planName: p.name,
        count: p.count,
        revenue: p.revenue
      }))

      const totalRevenue = planDistArray.reduce((sum, plan) => sum + plan.revenue, 0)

      const { data: recentOrgs } = await supabase
        .from('organizations')
        .select(`id, name, created_at`)
        .order('created_at', { ascending: false })
        .limit(10)

      const recentOrganizations = (recentOrgs || []).map(org => ({
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        plan_name: 'Sem Plano',
        status: 'inactive',
        members_count: 0
      }))

      setMetrics({
        totalOrganizations: totalOrgs || 0,
        activeSubscriptions: activeSubsData?.length || 0,
        totalRevenue,
        monthlyRecurringRevenue: totalRevenue,
        userGrowth: { current: 0, previous: 0, percentage: 0 },
        revenueGrowth: { current: totalRevenue, previous: 0, percentage: 0 },
        planDistribution: planDistArray,
        recentOrganizations,
        conversionRate: totalOrgs ? ((activeSubsData?.length || 0) / totalOrgs) * 100 : 0,
        churnRate: 5,
        averageRevenuePerUser: (activeSubsData?.length || 0) > 0 ? totalRevenue / (activeSubsData?.length || 1) : 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  return { metrics, loading, error, refresh: fetchMetrics }
}
