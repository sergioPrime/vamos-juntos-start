import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  billing_cycle: string
  features: string[] | null
  max_users: number | null
  max_invoices: number | null
  max_customers: number | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

export interface PlanFormData {
  name: string
  description: string
  price: number
  billing_cycle: string
  features: string[]
  max_users: number
  max_invoices: number
  max_customers: number
  is_active: boolean
  sort_order: number
}

export function usePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async (data: PlanFormData) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .insert([data])

      if (error) throw error

      toast.success('Plano criado com sucesso!')
      await fetchPlans()
      return true
    } catch (error: any) {
      console.error('Erro ao criar plano:', error)
      toast.error(error.message || 'Erro ao criar plano')
      return false
    }
  }

  const updatePlan = async (id: string, data: Partial<PlanFormData>) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update(data)
        .eq('id', id)

      if (error) throw error

      toast.success('Plano atualizado com sucesso!')
      await fetchPlans()
      return true
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error)
      toast.error(error.message || 'Erro ao atualizar plano')
      return false
    }
  }

  const deletePlan = async (id: string) => {
    try {
      // Check if plan has active subscriptions
      const { count } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_plan_id', id)
        .eq('subscription_status', 'active')

      if (count && count > 0) {
        toast.error(`Este plano possui ${count} assinatura(s) ativa(s) e não pode ser excluído`)
        return false
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Plano excluído com sucesso!')
      await fetchPlans()
      return true
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error)
      toast.error(error.message || 'Erro ao excluir plano')
      return false
    }
  }

  const togglePlanStatus = async (id: string, isActive: boolean) => {
    return await updatePlan(id, { is_active: !isActive })
  }

  const getPlanStats = async (planId: string) => {
    try {
      const { count: totalSubscriptions } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_plan_id', planId)

      const { count: activeSubscriptions } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_plan_id', planId)
        .eq('subscription_status', 'active')

      return {
        totalSubscriptions: totalSubscriptions || 0,
        activeSubscriptions: activeSubscriptions || 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { totalSubscriptions: 0, activeSubscriptions: 0 }
    }
  }

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    getPlanStats,
    refreshPlans: fetchPlans
  }
}
