import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useSuperAdmin } from './useSuperAdmin'

export interface AdminMetrics {
  totalOrganizations: number
  totalUsers: number
  totalFinancialEntries: number
  totalRevenue: number
  organizationsGrowth: number
  usersGrowth: number
  entriesGrowth: number
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

      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: totalEntries } = await supabase
        .from('financial_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_settled', true)

      const { data: revenueData } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('entry_type', 'receita')
        .eq('is_settled', true)

      const totalRevenue = revenueData?.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      ) || 0

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: recentOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      const organizationsGrowth = totalOrgs ? ((recentOrgs || 0) / totalOrgs) * 100 : 0

      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      const usersGrowth = totalUsers ? ((recentUsers || 0) / totalUsers) * 100 : 0

      const { count: recentEntries } = await supabase
        .from('financial_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_settled', true)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const entriesGrowth = totalEntries ? ((recentEntries || 0) / totalEntries) * 100 : 0

      const { data: entriesByType } = await supabase
        .from('financial_entries')
        .select('entry_type, amount')
        .eq('is_settled', true)

      const planDistribution = entriesByType?.reduce((acc: any[], entry: any) => {
        const typeName = entry.entry_type === 'receita' ? 'Receitas' : 'Despesas'
        const existing = acc.find(p => p.name === typeName)
        
        if (existing) {
          existing.count++
          existing.value += Math.abs(entry.amount || 0)
        } else {
          acc.push({
            name: typeName,
            count: 1,
            value: Math.abs(entry.amount || 0)
          })
        }
        
        return acc
      }, []) || []

      const { data: recentOrganizations } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

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
        totalFinancialEntries: totalEntries || 0,
        totalRevenue,
        organizationsGrowth,
        usersGrowth,
        entriesGrowth,
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
