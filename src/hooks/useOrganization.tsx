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
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  userOrgs: [],
  loading: true
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchUserOrganizations() {
      if (!user) {
        setUserOrgs([])
        setCurrentOrg(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_organizations')
          .select(`
            org_id,
            role,
            organization:organizations(id, name, slug)
          `)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching organizations:', error)
          setLoading(false)
          return
        }

        const organizations = data?.map(item => ({
          org_id: item.org_id,
          role: item.role,
          organization: item.organization as Organization
        })) || []

        setUserOrgs(organizations)
        
        // Set the first organization as current org (for single-tenant users)
        if (organizations.length > 0) {
          setCurrentOrg(organizations[0].organization)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error in fetchUserOrganizations:', error)
        setLoading(false)
      }
    }

    fetchUserOrganizations()
  }, [user])

  return (
    <OrganizationContext.Provider value={{ currentOrg, userOrgs, loading }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}