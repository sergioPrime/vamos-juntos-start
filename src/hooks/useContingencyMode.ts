import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContingencyStatus {
  contingencia_ativa: boolean;
  motivo_contingencia: string | null;
  data_inicio_contingencia: string | null;
}

/**
 * Hook for managing NFC-e contingency mode
 * Handles offline queue and synchronization
 */
export function useContingencyMode(orgId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get contingency status
  const { data: contingencyStatus, isLoading } = useQuery({
    queryKey: ['contingency-status', orgId],
    queryFn: async (): Promise<ContingencyStatus | null> => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('contingencia_ativa, motivo_contingencia, data_inicio_contingencia')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get pending queue items
  const { data: queueItems } = useQuery({
    queryKey: ['contingency-queue', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfce_contingency_queue')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId && !!contingencyStatus?.contingencia_ativa,
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Activate contingency mode
  const activateContingency = useMutation({
    mutationFn: async (motivo: string) => {
      const { data, error } = await supabase
        .rpc('activate_nfce_contingency', {
          p_org_id: orgId,
          p_motivo: motivo,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingency-status', orgId] });
      toast({
        title: "Modo contingência ativado",
        description: "As NFC-e serão armazenadas localmente até reconexão",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao ativar contingência",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Deactivate contingency mode
  const deactivateContingency = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('deactivate_nfce_contingency', {
          p_org_id: orgId,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingency-status', orgId] });
      toast({
        title: "Modo contingência desativado",
        description: "Retornando à operação normal",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desativar contingência",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Add NFC-e to contingency queue
  const addToQueue = useMutation({
    mutationFn: async (nfceData: any) => {
      const { data, error } = await supabase
        .from('nfce_contingency_queue')
        .insert({
          org_id: orgId,
          nfce_data: nfceData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingency-queue', orgId] });
      toast({
        title: "NFC-e adicionada à fila",
        description: "Será transmitida automaticamente quando possível",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar à fila",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Synchronize queue (transmit pending items)
  const synchronizeQueue = useMutation({
    mutationFn: async () => {
      // Get pending items via RPC
      const { data: pending, error: rpcError } = await supabase
        .rpc('get_pending_contingency_nfce', {
          p_org_id: orgId,
          p_limit: 50,
        }) as any;

      if (rpcError) throw rpcError;

      if (!pending || pending.length === 0) {
        return { transmitted: 0, failed: 0 };
      }

      let transmitted = 0;
      let failed = 0;

      // Try to transmit each item
      for (const item of pending) {
        try {
          // Call authorization function
          const { data, error } = await supabase.functions.invoke('nfce-authorize', {
            body: { nfceData: item.nfce_data, orgId },
          });

          if (error || !data.success) {
            // Mark as failed
            await supabase.rpc('mark_contingency_failed', {
              p_queue_id: item.id,
              p_error_message: data?.error || error?.message || 'Unknown error',
            });
            failed++;
          } else {
            // Mark as transmitted
            await supabase.rpc('mark_contingency_transmitted', {
              p_queue_id: item.id,
            });
            transmitted++;
          }
        } catch (error) {
          console.error('Error transmitting contingency item:', error);
          failed++;
        }
      }

      return { transmitted, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contingency-queue', orgId] });
      
      if (result.transmitted > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${result.transmitted} NFC-e transmitida(s), ${result.failed} falha(s)`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  return {
    contingencyStatus,
    isLoading,
    queueItems,
    queueCount: queueItems?.length || 0,
    isContingencyActive: contingencyStatus?.contingencia_ativa || false,
    activateContingency: activateContingency.mutate,
    deactivateContingency: deactivateContingency.mutate,
    addToQueue: addToQueue.mutate,
    synchronizeQueue: synchronizeQueue.mutate,
    isSynchronizing: synchronizeQueue.isPending,
  };
}
