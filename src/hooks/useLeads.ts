import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'

export interface Lead {
  id: string
  org_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  source?: string
  status: 'novo' | 'qualificado' | 'negociacao' | 'ganho' | 'perdido'
  score?: number
  estimated_value?: number
  notes?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const fetchLeads = async () => {
    if (!currentOrg) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!currentOrg || !user) return

    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert([{
          ...leadData,
          org_id: currentOrg.id,
          created_by: user.id
        }])
        .select()
        .single()

      if (error) throw error
      
      setLeads(prev => [data, ...prev])
      toast.success('Lead criado com sucesso')
      return data
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Erro ao criar lead')
      throw error
    }
  }

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setLeads(prev => prev.map(lead => lead.id === id ? data : lead))
      toast.success('Lead atualizado com sucesso')
      return data
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Erro ao atualizar lead')
      throw error
    }
  }

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setLeads(prev => prev.filter(lead => lead.id !== id))
      toast.success('Lead excluído com sucesso')
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Erro ao excluir lead')
      throw error
    }
  }

  useEffect(() => {
    if (currentOrg) {
      fetchLeads()
    }
  }, [currentOrg])

  return {
    leads,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead
  }
}
