import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface Organization {
  id: string
  name: string
  slug: string
}

interface UserOrganization {
  org_id: string
  role: string
  organization: Organization
}

interface OrganizationContextType {
  currentOrg: Organization | null
  userOrgs: UserOrganization[]
  loading: boolean
  setCurrentOrg: (org: Organization) => void
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  userOrgs: [],
  loading: true,
  setCurrentOrg: () => {}
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setCurrentOrg(null)
      setUserOrgs([])
      setLoading(false)
      return
    }

    fetchUserOrganizations()
  }, [user])

  const fetchUserOrganizations = async () => {
    try {
      setLoading(true)
      
      // Buscar organizações do usuário
      const { data: userOrganizations, error } = await supabase
        .from('user_organizations')
        .select(`
          org_id,
          role,
          organization:organizations(id, name, slug)
        `)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error fetching user organizations:', error)
        return
      }

      const formattedOrgs = userOrganizations?.map(uo => ({
        org_id: uo.org_id,
        role: uo.role,
        organization: uo.organization as Organization
      })) || []

      setUserOrgs(formattedOrgs)
      
      // Definir a primeira organização como atual se ainda não houver uma definida
      if (formattedOrgs.length > 0 && !currentOrg) {
        setCurrentOrg(formattedOrgs[0].organization)
      }
    } catch (error) {
      console.error('Error in fetchUserOrganizations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <OrganizationContext.Provider value={{ currentOrg, userOrgs, loading, setCurrentOrg }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}