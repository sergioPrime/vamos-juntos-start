import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    checkSuperAdminRole()
  }, [user])

  const checkSuperAdminRole = async () => {
    if (!user) {
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      setIsSuperAdmin(!!data)
    } catch (error) {
      console.error('Erro ao verificar role de superadmin:', error)
      setIsSuperAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  return { isSuperAdmin, loading }
}