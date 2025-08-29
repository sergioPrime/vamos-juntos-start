import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

  useEffect(() => {
    // Por enquanto, apenas simular carregamento
    // Na implementação real, buscaríamos do Supabase
    setLoading(false)
  }, [])

  return (
    <OrganizationContext.Provider value={{ currentOrg, userOrgs, loading }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}