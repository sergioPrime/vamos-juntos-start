import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing NFC-e operations with real SEFAZ integration
 */
export function useNFCe(orgId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load NFCe list
  const { data: nfceList, isLoading } = useQuery({
    queryKey: ['nfce', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Emit NFCe (real SEFAZ integration)
  const emitNFCe = async (nfceData: any) => {
    try {
      console.log('Emitting NFCe via SEFAZ integration...');
      
      const { data, error } = await supabase.functions.invoke('nfce-authorize', {
        body: { nfceData, orgId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "NFC-e emitida com sucesso",
        description: `NFC-e ${data.nfce.numero} autorizada pela SEFAZ.`,
      });

      queryClient.invalidateQueries({ queryKey: ['nfce', orgId] });
      
      return data.nfce;
    } catch (error) {
      console.error('Error emitting NFCe:', error);
      toast({
        title: "Erro ao emitir NFC-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cancel NFCe (real SEFAZ integration)
  const cancelNFCe = async (nfceId: string, justificativa: string) => {
    try {
      console.log('Cancelling NFCe via SEFAZ integration...');
      
      const { data, error } = await supabase.functions.invoke('nfce-cancel', {
        body: { nfceId, justificativa, orgId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "NFC-e cancelada",
        description: "A NFC-e foi cancelada com sucesso na SEFAZ.",
      });

      queryClient.invalidateQueries({ queryKey: ['nfce', orgId] });
    } catch (error) {
      console.error('Error cancelling NFCe:', error);
      toast({
        title: "Erro ao cancelar NFC-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Query NFCe status
  const queryNFCeStatus = async (chaveAcesso: string) => {
    try {
      console.log('Querying NFCe status from SEFAZ...');
      
      const { data, error } = await supabase.functions.invoke('nfce-status', {
        body: { chaveAcesso, orgId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.status;
    } catch (error) {
      console.error('Error querying NFCe status:', error);
      toast({
        title: "Erro ao consultar NFC-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Inutilize number range
  const inutilizeRange = async (serie: string, numeroInicial: number, numeroFinal: number, justificativa: string) => {
    try {
      console.log('Inutilizing number range via SEFAZ...');
      
      const { data, error } = await supabase.functions.invoke('nfce-inutilize', {
        body: { serie, numeroInicial, numeroFinal, justificativa, orgId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Numeração inutilizada",
        description: "A faixa de numeração foi inutilizada com sucesso na SEFAZ.",
      });

      return data.sefazResponse;
    } catch (error) {
      console.error('Error inutilizing range:', error);
      toast({
        title: "Erro ao inutilizar numeração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    nfceList,
    isLoading,
    emitNFCe,
    cancelNFCe,
    queryNFCeStatus,
    inutilizeRange,
  };
}
