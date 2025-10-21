import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'

export interface PipelineStage {
  id: string
  name: string
  order_number: number
  probability: number
}

export interface Opportunity {
  id: string
  org_id: string
  lead_id?: string
  stage_id: string
  title: string
  company_name?: string
  value?: number
  probability?: number
  expected_close_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export function useSalesPipeline() {
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const { currentOrg } = useOrganization()

  const fetchPipeline = async () => {
    if (!currentOrg) return

    try {
      setLoading(true)
      
      const { data: stagesData, error: stagesError } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('order_number')

      if (stagesError) throw stagesError

      const { data: oppsData, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })

      if (oppsError) throw oppsError

      setPipeline(stagesData || [])
      setOpportunities(oppsData || [])
    } catch (error) {
      console.error('Error fetching pipeline:', error)
      toast.error('Erro ao carregar pipeline')
    } finally {
      setLoading(false)
    }
  }

  const updateOpportunityStage = async (opportunityId: string, newStageId: string) => {
    try {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
        .eq('id', opportunityId)

      if (error) throw error

      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === opportunityId ? { ...opp, stage_id: newStageId } : opp
        )
      )

      toast.success('Oportunidade movida com sucesso')
    } catch (error) {
      console.error('Error updating opportunity:', error)
      toast.error('Erro ao mover oportunidade')
    }
  }

  useEffect(() => {
    if (currentOrg) {
      fetchPipeline()
    }
  }, [currentOrg])

  return {
    pipeline,
    opportunities,
    loading,
    updateOpportunityStage,
    fetchPipeline
  }
}
