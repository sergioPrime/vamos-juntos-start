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
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  userOrgs: [],
  loading: true,
  refreshOrganizations: async () => {}
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const refreshOrganizations = async () => {
    if (!user) {
      setCurrentOrg(null)
      setUserOrgs([])
      setLoading(false)
      return
    }

    try {
      // Buscar as organizações do usuário
      const { data: userOrganizations, error } = await supabase
        .from('user_organizations')
        .select(`
          org_id,
          role,
          organizations:org_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching user organizations:', error)
        return
      }

      const mappedOrgs: UserOrganization[] = userOrganizations?.map((uo: any) => ({
        org_id: uo.org_id,
        role: uo.role,
        organization: {
          id: uo.organizations.id,
          name: uo.organizations.name,
          slug: uo.organizations.slug
        }
      })) || []

      setUserOrgs(mappedOrgs)
      
      // Priorizar a organização da empresa padrão ativa
      if (mappedOrgs.length > 0) {
        // Primeiro, tentar encontrar a organização que tem a empresa padrão ativa
        const { data: defaultCompany } = await supabase
          .from('companies')
          .select('org_id')
          .eq('is_default', true)
          .eq('is_active', true)
          .single()

        if (defaultCompany) {
          const defaultOrg = mappedOrgs.find(org => org.org_id === defaultCompany.org_id)
          if (defaultOrg) {
            setCurrentOrg(defaultOrg.organization)
          } else {
            // Se não encontrou, usar a primeira organização
            setCurrentOrg(mappedOrgs[0].organization)
          }
        } else {
          // Se não há empresa padrão, usar a primeira organização
          setCurrentOrg(mappedOrgs[0].organization)
        }
      } else {
        setCurrentOrg(null)
      }
    } catch (error) {
      console.error('Error in refreshOrganizations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshOrganizations()
  }, [user])

  return (
    <OrganizationContext.Provider value={{ currentOrg, userOrgs, loading, refreshOrganizations }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}