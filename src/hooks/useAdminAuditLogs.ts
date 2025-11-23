import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface AdminAuditLog {
  id: string
  user_id: string
  user_email: string
  action_type: 'create' | 'update' | 'delete' | 'activate' | 'deactivate'
  entity_type: string
  entity_id: string
  old_values?: any
  new_values?: any
  metadata?: any
  created_at: string
}

export function useAdminAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin_audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_audit_logs'
        },
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (fetchError) throw fetchError

      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching admin audit logs:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const filterByActionType = (actionType: string) => {
    return logs.filter(log => log.action_type === actionType)
  }

  const filterByEntityType = (entityType: string) => {
    return logs.filter(log => log.entity_type === entityType)
  }

  const filterByUser = (userId: string) => {
    return logs.filter(log => log.user_id === userId)
  }

  const getStats = () => {
    return {
      total: logs.length,
      creates: logs.filter(l => l.action_type === 'create').length,
      updates: logs.filter(l => l.action_type === 'update').length,
      deletes: logs.filter(l => l.action_type === 'delete').length,
      uniqueUsers: new Set(logs.map(l => l.user_id)).size
    }
  }

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
    filterByActionType,
    filterByEntityType,
    filterByUser,
    getStats
  }
}
