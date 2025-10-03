import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

type Role = 'user' | 'admin' | 'superadmin'

export function useRoleCheck() {
  const [role, setRole] = useState<Role>('user')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    checkUserRole()
  }, [user])

  const checkUserRole = async () => {
    if (!user) {
      setRole('user')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data?.role === 'superadmin') {
        setRole('superadmin')
      } else if (data?.role === 'admin') {
        setRole('admin')
      } else {
        setRole('user')
      }
    } catch (error) {
      console.error('Erro ao verificar role:', error)
      setRole('user')
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (requiredRole: Role): boolean => {
    const roleHierarchy: Record<Role, number> = {
      user: 1,
      admin: 2,
      superadmin: 3
    }

    return roleHierarchy[role] >= roleHierarchy[requiredRole]
  }

  return {
    role,
    loading,
    hasRole,
    isUser: role === 'user',
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin'
  }
}
