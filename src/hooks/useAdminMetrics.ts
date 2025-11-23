import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useSuperAdmin } from './useSuperAdmin'

export interface AdminMetrics {
  totalOrganizations: number
  totalUsers: number
  activeSubscriptions: number
  monthlyRevenue: number
  organizationsGrowth: number
  usersGrowth: number
  revenueGrowth: number
  planDistribution: { name: string; count: number; value: number }[]
  recentOrganizations: Array<{
    id: string
    name: string
    created_at: string
    users_count: number
  }>
}

export function useAdminMetrics() {
  const { user } = useAuth()
  const { isSuperAdmin } = useSuperAdmin()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setLoading(false)
      return
    }

    loadMetrics()
  }, [user, isSuperAdmin])

  const loadMetrics = async () => {
    try {
      setLoading(true)

      // Total Organizations
      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Total Users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Active Subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id, monthly_price')
        .eq('status', 'active')

      const activeSubsCount = activeSubscriptions?.length || 0
      const monthlyRevenue = activeSubscriptions?.reduce(
        (sum, sub) => sum + (sub.monthly_price || 0),
        0
      ) || 0

      // Organizations created in last 30 days (growth)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: recentOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      const organizationsGrowth = totalOrgs ? ((recentOrgs || 0) / totalOrgs) * 100 : 0

      // Users created in last 30 days (growth)
      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      const usersGrowth = totalUsers ? ((recentUsers || 0) / totalUsers) * 100 : 0

      // Revenue growth (comparing to previous 30 days)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const { data: previousPeriodSubs } = await supabase
        .from('user_subscriptions')
        .select('monthly_price')
        .eq('status', 'active')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())

      const previousRevenue = previousPeriodSubs?.reduce(
        (sum, sub) => sum + (sub.monthly_price || 0),
        0
      ) || 0

      const revenueGrowth = previousRevenue > 0 
        ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      // Plan Distribution
      const { data: planData } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          monthly_price,
          subscription_plans!inner(name)
        `)
        .eq('status', 'active')

      const planDistribution = planData?.reduce((acc: any[], sub: any) => {
        const planName = sub.subscription_plans?.name || 'Desconhecido'
        const existing = acc.find(p => p.name === planName)
        
        if (existing) {
          existing.count++
          existing.value += sub.monthly_price || 0
        } else {
          acc.push({
            name: planName,
            count: 1,
            value: sub.monthly_price || 0
          })
        }
        
        return acc
      }, []) || []

      // Recent Organizations (last 10)
      const { data: recentOrganizations } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get user count for each organization
      const orgsWithUsers = await Promise.all(
        (recentOrganizations || []).map(async (org) => {
          const { count } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)

          return {
            ...org,
            users_count: count || 0
          }
        })
      )

      setMetrics({
        totalOrganizations: totalOrgs || 0,
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubsCount,
        monthlyRevenue,
        organizationsGrowth,
        usersGrowth,
        revenueGrowth,
        planDistribution,
        recentOrganizations: orgsWithUsers
      })
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    refreshMetrics: loadMetrics
  }
}
