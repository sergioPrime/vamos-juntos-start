import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'

interface BlockchainAlert {
  id: string
  org_id: string
  alert_type: string
  severity: string
  block_id: string | null
  block_number: number | null
  message: string
  details: any
  is_read: boolean
  is_resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
}

export function useBlockchainAlerts() {
  const [alerts, setAlerts] = useState<BlockchainAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { currentOrg } = useOrganization()

  const loadAlerts = async () => {
    if (!currentOrg?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blockchain_alerts')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setAlerts(data || [])
      
      // Count unread
      const unread = data?.filter(a => !a.is_read && !a.is_resolved).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
      toast.error('Erro ao carregar alertas')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('blockchain_alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar como lido:', error)
      toast.error('Erro ao marcar alerta como lido')
    }
  }

  const markAsResolved = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('blockchain_alerts')
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => 
        prev.map(a => a.id === alertId 
          ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } 
          : a
        )
      )
      
      toast.success('Alerta marcado como resolvido')
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
      toast.error('Erro ao resolver alerta')
    }
  }

  const markAllAsRead = async () => {
    if (!currentOrg?.id) return

    try {
      const { error } = await supabase
        .from('blockchain_alerts')
        .update({ is_read: true })
        .eq('org_id', currentOrg.id)
        .eq('is_read', false)

      if (error) throw error

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      setUnreadCount(0)
      
      toast.success('Todos os alertas marcados como lidos')
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error)
      toast.error('Erro ao marcar alertas como lidos')
    }
  }

  // Load initial alerts
  useEffect(() => {
    loadAlerts()
  }, [currentOrg?.id])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentOrg?.id) return

    const channel = supabase
      .channel('blockchain-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blockchain_alerts',
          filter: `org_id=eq.${currentOrg.id}`
        },
        (payload) => {
          console.log('Blockchain alert realtime update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as BlockchainAlert
            setAlerts(prev => [newAlert, ...prev])
            setUnreadCount(prev => prev + 1)
            
            // Show toast notification for critical alerts
            if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
              toast.error('🚨 Alerta de Segurança Blockchain', {
                description: newAlert.message,
                duration: 10000,
                action: {
                  label: 'Ver Detalhes',
                  onClick: () => window.location.href = '/settings/blockchain'
                }
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new as BlockchainAlert : a)
            )
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentOrg?.id])

  return {
    alerts,
    unreadCount,
    loading,
    loadAlerts,
    markAsRead,
    markAsResolved,
    markAllAsRead
  }
}
