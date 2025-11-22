import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ContingencyItem {
  id: string;
  nfce_data: any;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'transmitting' | 'transmitted' | 'failed';
  error_message?: string;
}

export function useNFCeContingency() {
  const { toast } = useToast();
  const [isContingencyActive, setIsContingencyActive] = useState(false);
  const [contingencyQueue, setContingencyQueue] = useState<ContingencyItem[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Verificar status da contingência
  const checkContingencyStatus = async (orgId: string) => {
    try {
      const { data: config, error } = await supabase
        .from('fiscal_config')
        .select('nfce_contingencia_ativa')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      setIsContingencyActive(config?.nfce_contingencia_ativa || false);
      return config?.nfce_contingencia_ativa || false;
    } catch (error) {
      console.error('Erro ao verificar contingência:', error);
      return false;
    }
  };

  // Ativar contingência
  const activateContingency = async (orgId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_config')
        .update({
          nfce_contingencia_ativa: true,
          motivo_contingencia: reason,
          data_inicio_contingencia: new Date().toISOString()
        })
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (error) throw error;

      setIsContingencyActive(true);

      toast({
        title: "Contingência ativada",
        description: "As NFC-e serão emitidas em modo offline e transmitidas posteriormente.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao ativar contingência:', error);
      toast({
        title: "Erro ao ativar contingência",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Desativar contingência
  const deactivateContingency = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_config')
        .update({
          nfce_contingencia_ativa: false,
          motivo_contingencia: null,
          data_inicio_contingencia: null
        })
        .eq('org_id', orgId)
        .eq('is_active', true);

      if (error) throw error;

      setIsContingencyActive(false);

      toast({
        title: "Contingência desativada",
        description: "As NFC-e voltarão a ser transmitidas normalmente.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao desativar contingência:', error);
      toast({
        title: "Erro ao desativar contingência",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Carregar fila de contingência
  const loadContingencyQueue = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('nfce_contingency_queue')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setContingencyQueue(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      return [];
    }
  };

  // Transmitir NFC-e da fila
  const transmitFromQueue = async (itemId: string) => {
    try {
      // Buscar item da fila
      const { data: item, error: fetchError } = await supabase
        .from('nfce_contingency_queue')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar status para transmitindo
      await supabase
        .from('nfce_contingency_queue')
        .update({ status: 'transmitting' })
        .eq('id', itemId);

      // Tentar transmitir
      const { data, error } = await supabase.functions.invoke('emit-nfce', {
        body: item.nfce_data
      });

      if (error) throw error;

      if (data.success) {
        // Marcar como transmitida
        await supabase
          .from('nfce_contingency_queue')
          .update({ 
            status: 'transmitted',
            transmitted_at: new Date().toISOString()
          })
          .eq('id', itemId);

        toast({
          title: "NFC-e transmitida",
          description: `NFC-e ${item.nfce_data.numero} transmitida com sucesso.`,
        });

        return { success: true, data };
      } else {
        throw new Error(data.message || 'Erro ao transmitir');
      }
    } catch (error: any) {
      console.error('Erro ao transmitir da fila:', error);

      // Incrementar contador de tentativas
      await supabase
        .from('nfce_contingency_queue')
        .update({ 
          status: 'failed',
          retry_count: supabase.rpc('increment', { row_id: itemId }),
          error_message: error.message
        })
        .eq('id', itemId);

      toast({
        title: "Erro ao transmitir",
        description: error.message,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Transmitir todas da fila
  const transmitAllFromQueue = async (orgId: string) => {
    setIsTransmitting(true);
    
    try {
      const queue = await loadContingencyQueue(orgId);
      const pending = queue.filter(item => item.status === 'pending' || item.status === 'failed');

      let successCount = 0;
      let errorCount = 0;

      for (const item of pending) {
        try {
          await transmitFromQueue(item.id);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Transmissão concluída",
        description: `${successCount} NFC-e transmitidas, ${errorCount} erros.`,
      });

      await loadContingencyQueue(orgId);
      
      return { success: true, successCount, errorCount };
    } catch (error) {
      console.error('Erro ao transmitir fila:', error);
      throw error;
    } finally {
      setIsTransmitting(false);
    }
  };

  // Remover item da fila
  const removeFromQueue = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('nfce_contingency_queue')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "Item removido da fila de contingência.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isContingencyActive,
    contingencyQueue,
    isTransmitting,
    checkContingencyStatus,
    activateContingency,
    deactivateContingency,
    loadContingencyQueue,
    transmitFromQueue,
    transmitAllFromQueue,
    removeFromQueue
  };
}
