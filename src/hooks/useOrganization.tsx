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
  switchOrganization: (orgId: string) => void
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  userOrgs: [],
  loading: true,
  switchOrganization: () => {}
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function loadUserOrganizations() {
      if (!user) {
        setCurrentOrg(null)
        setUserOrgs([])
        setLoading(false)
        return
      }

      try {
        // Buscar organizações do usuário
        const { data: userOrganizations, error } = await supabase
          .from('user_organizations')
          .select(`
            org_id,
            role,
            organization:organizations(
              id,
              name,
              slug
            )
          `)
          .eq('user_id', user.id)

        if (error) {
          console.error('Erro ao carregar organizações:', error)
          setLoading(false)
          return
        }

        const formattedOrgs = userOrganizations?.map(uo => ({
          org_id: uo.org_id,
          role: uo.role,
          organization: uo.organization as Organization
        })) || []

        setUserOrgs(formattedOrgs)

        // Definir organização atual (primeira da lista por padrão)
        if (formattedOrgs.length > 0) {
          setCurrentOrg(formattedOrgs[0].organization)
        }
      } catch (error) {
        console.error('Erro ao carregar organizações:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserOrganizations()
  }, [user])

  const switchOrganization = (orgId: string) => {
    const targetOrg = userOrgs.find(uo => uo.organization.id === orgId)
    if (targetOrg) {
      setCurrentOrg(targetOrg.organization)
    }
  }

  return (
    <OrganizationContext.Provider value={{ currentOrg, userOrgs, loading, switchOrganization }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}