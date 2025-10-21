import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'

export interface CRMMetrics {
  totalLeads: number
  newLeadsThisMonth: number
  pipelineValue: number
  activeOpportunities: number
  conversionRate: number
  wonDeals: number
  activitiesToday: number
  overdueActivities: number
  pendingTasks: any[]
  scheduledCalls: any[]
}

export function useCRMMetrics() {
  const [metrics, setMetrics] = useState<CRMMetrics>({
    totalLeads: 0,
    newLeadsThisMonth: 0,
    pipelineValue: 0,
    activeOpportunities: 0,
    conversionRate: 0,
    wonDeals: 0,
    activitiesToday: 0,
    overdueActivities: 0,
    pendingTasks: [],
    scheduledCalls: []
  })
  const [loading, setLoading] = useState(true)
  const { currentOrg } = useOrganization()

  const fetchMetrics = async () => {
    if (!currentOrg) return

    try {
      setLoading(true)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('org_id', currentOrg.id)

      if (leadsError) throw leadsError

      const { data: opportunities, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('org_id', currentOrg.id)

      if (oppsError) throw oppsError

      const { data: activities, error: activitiesError } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('org_id', currentOrg.id)

      if (activitiesError) throw activitiesError

      const newLeadsThisMonth = leads?.filter(
        l => new Date(l.created_at) >= startOfMonth
      ).length || 0

      const activeOpps = opportunities?.filter(
        o => o.stage_id && !['ganho', 'perdido'].includes(o.status)
      ) || []

      const wonDeals = leads?.filter(l => l.status === 'ganho').length || 0

      const pipelineValue = activeOpps.reduce((sum, opp) => sum + (opp.value || 0), 0)

      const conversionRate = leads && leads.length > 0
        ? Math.round((wonDeals / leads.length) * 100)
        : 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const activitiesToday = activities?.filter(
        a => new Date(a.scheduled_at).toDateString() === today.toDateString()
      ).length || 0

      const overdueActivities = activities?.filter(
        a => new Date(a.scheduled_at) < today && !a.completed
      ).length || 0

      setMetrics({
        totalLeads: leads?.length || 0,
        newLeadsThisMonth,
        pipelineValue,
        activeOpportunities: activeOpps.length,
        conversionRate,
        wonDeals,
        activitiesToday,
        overdueActivities,
        pendingTasks: [],
        scheduledCalls: []
      })
    } catch (error) {
      console.error('Error fetching CRM metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrg) {
      fetchMetrics()
    }
  }, [currentOrg])

  return { metrics, loading, fetchMetrics }
}
