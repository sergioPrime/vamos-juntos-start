import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface WebhookLog {
  id: string
  event_type: string
  event_id: string
  status: 'success' | 'failed' | 'pending'
  payload: any
  error_message?: string
  created_at: string
  processed_at?: string
}

export function useWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('webhook_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_logs'
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
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching webhook logs:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }

  const filterByEventType = (eventType: string) => {
    return logs.filter(log => log.event_type === eventType)
  }

  const filterByStatus = (status: 'success' | 'failed' | 'pending') => {
    return logs.filter(log => log.status === status)
  }

  const getStats = () => {
    return {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      pending: logs.filter(l => l.status === 'pending').length
    }
  }

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
    filterByEventType,
    filterByStatus,
    getStats
  }
}
