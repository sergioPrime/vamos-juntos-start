import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
  is_active?: boolean
  subscription_plan_id?: string | null
  subscription_status?: string | null
}

export interface OrganizationWithStats extends Organization {
  users_count: number
  active_users: number
  plan_name?: string
  owner_email?: string
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // For each org, get stats
      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Count users
          const { count: usersCount } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)

          // Count active users (optional - could be users who logged in recently)
          const { count: activeUsers } = await supabase
            .from('user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)

          // Get subscription info
          const { data: subData } = await supabase
            .from('user_organizations')
            .select('subscription_plan_id, subscription_status, subscription_plans(name)')
            .eq('org_id', org.id)
            .eq('role', 'owner')
            .limit(1)
            .single()

          // Get owner email
          const { data: ownerData } = await supabase
            .from('user_organizations')
            .select('user_id, profiles(email)')
            .eq('org_id', org.id)
            .eq('role', 'owner')
            .limit(1)
            .single()

          return {
            ...org,
            users_count: usersCount || 0,
            active_users: activeUsers || 0,
            subscription_plan_id: subData?.subscription_plan_id,
            subscription_status: subData?.subscription_status,
            plan_name: subData?.subscription_plans?.name,
            owner_email: ownerData?.profiles?.email
          }
        })
      )

      setOrganizations(orgsWithStats)
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
      toast.error('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }

  const toggleOrganizationStatus = async (orgId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !currentStatus })
        .eq('id', orgId)

      if (error) throw error

      toast.success(`Organização ${!currentStatus ? 'ativada' : 'suspensa'} com sucesso!`)
      await fetchOrganizations()
      return true
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      toast.error(error.message || 'Erro ao alterar status da organização')
      return false
    }
  }

  const updateOrganization = async (orgId: string, data: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', orgId)

      if (error) throw error

      toast.success('Organização atualizada com sucesso!')
      await fetchOrganizations()
      return true
    } catch (error: any) {
      console.error('Erro ao atualizar organização:', error)
      toast.error(error.message || 'Erro ao atualizar organização')
      return false
    }
  }

  const deleteOrganization = async (orgId: string) => {
    try {
      // Check if has users
      const { count } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      if (count && count > 0) {
        toast.error(`Esta organização possui ${count} usuário(s) e não pode ser excluída. Suspenda-a ao invés disso.`)
        return false
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      toast.success('Organização excluída com sucesso!')
      await fetchOrganizations()
      return true
    } catch (error: any) {
      console.error('Erro ao excluir organização:', error)
      toast.error(error.message || 'Erro ao excluir organização')
      return false
    }
  }

  const getOrganizationDetails = async (orgId: string) => {
    try {
      // Get organization data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (orgError) throw orgError

      // Get users
      const { data: users, error: usersError } = await supabase
        .from('user_organizations')
        .select(`
          id,
          role,
          created_at,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .eq('org_id', orgId)

      if (usersError) throw usersError

      // Get recent activity (financial entries count)
      const { count: entriesCount } = await supabase
        .from('financial_entries')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      // Get products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      // Get customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      return {
        organization: org,
        users: users || [],
        stats: {
          financial_entries: entriesCount || 0,
          products: productsCount || 0,
          customers: customersCount || 0
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      return null
    }
  }

  return {
    organizations,
    loading,
    toggleOrganizationStatus,
    updateOrganization,
    deleteOrganization,
    getOrganizationDetails,
    refreshOrganizations: fetchOrganizations
  }
}
