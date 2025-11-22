import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'

export function useContingencyMode() {
  const { toast } = useToast()
  const { currentOrg } = useOrganization()
  const [isActive, setIsActive] = useState(false)
  const [activatedAt, setActivatedAt] = useState<Date | null>(null)
  const [queueCount, setQueueCount] = useState(0)

  // Verificar status de contingência
  const checkContingencyStatus = useCallback(async () => {
    if (!currentOrg?.id) return

    try {
      const { data: config, error } = await supabase
        .from('fiscal_config')
        .select('nfce_contingencia_ativa')
        .eq('org_id', currentOrg.id)
        .single()

      if (error) throw error

      setIsActive(config?.nfce_contingencia_ativa || false)
    } catch (error) {
      console.error('Error checking contingency status:', error)
    }
  }, [currentOrg?.id])

  // Buscar quantidade na fila
  const fetchQueueCount = useCallback(async () => {
    if (!currentOrg?.id) return

    try {
      const { count, error } = await (supabase as any)
        .from('nfce_contingencia_queue')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', currentOrg.id)
        .eq('sincronizado', false)

      if (error) throw error

      setQueueCount(count || 0)
    } catch (error) {
      console.error('Error fetching queue count:', error)
    }
  }, [currentOrg?.id])

  useEffect(() => {
    checkContingencyStatus()
    fetchQueueCount()

    // Polling a cada 30 segundos
    const interval = setInterval(() => {
      checkContingencyStatus()
      fetchQueueCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [checkContingencyStatus, fetchQueueCount])

  const activateContingency = async (motivo: string) => {
    if (!currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from('fiscal_config')
        .update({ 
          nfce_contingencia_ativa: true
        })
        .eq('org_id', currentOrg.id)

      if (error) throw error

      setIsActive(true)
      setActivatedAt(new Date())

      toast({
        title: 'Modo de contingência ativado',
        description: motivo || 'Sistema operando em contingência offline',
        variant: 'default',
      })

      return true
    } catch (error) {
      console.error('Error activating contingency:', error)
      toast({
        title: 'Erro ao ativar contingência',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }
  }

  const deactivateContingency = async () => {
    if (!currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from('fiscal_config')
        .update({ 
          nfce_contingencia_ativa: false
        })
        .eq('org_id', currentOrg.id)

      if (error) throw error

      setIsActive(false)
      setActivatedAt(null)

      toast({
        title: 'Modo de contingência desativado',
        description: 'Sistema voltou ao modo normal',
      })

      // Tentar sincronizar fila automaticamente
      if (queueCount > 0) {
        await syncQueue()
      }

      return true
    } catch (error) {
      console.error('Error deactivating contingency:', error)
      toast({
        title: 'Erro ao desativar contingência',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }
  }

  const syncQueue = async () => {
    if (!currentOrg?.id) return

    try {
      // Buscar itens não sincronizados
      const { data: queue, error: queueError } = await (supabase as any)
        .from('nfce_contingencia_queue')
        .select('*, nfce:nfce_id(*)')
        .eq('org_id', currentOrg.id)
        .eq('sincronizado', false)
        .order('data_emissao', { ascending: true })

      if (queueError) throw queueError

      if (!queue || queue.length === 0) {
        toast({
          title: 'Fila vazia',
          description: 'Não há notas pendentes para sincronizar',
        })
        return
      }

      toast({
        title: 'Sincronizando notas',
        description: `${queue.length} nota(s) serão sincronizadas...`,
      })

      // Aqui você implementaria a lógica de sincronização real
      // Por enquanto, apenas marcamos como sincronizado para demonstração
      for (const item of queue) {
        // Simular envio para SEFAZ
        // Em produção, chamar o edge function de emissão
        
        await (supabase as any)
          .from('nfce_contingencia_queue')
          .update({ 
            sincronizado: true,
            ultima_tentativa: new Date().toISOString(),
            tentativas: (item.tentativas || 0) + 1
          })
          .eq('id', item.id)

        await (supabase as any)
          .from('nfce')
          .update({ 
            sincronizado: true,
            status: 'autorizada' // Em produção, baseado no retorno da SEFAZ
          })
          .eq('id', item.nfce_id)
      }

      toast({
        title: 'Sincronização concluída',
        description: `${queue.length} nota(s) sincronizada(s) com sucesso`,
      })

      fetchQueueCount()
    } catch (error) {
      console.error('Error syncing queue:', error)
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return {
    isActive,
    activatedAt,
    queueCount,
    activateContingency,
    deactivateContingency,
    syncQueue
  }
}