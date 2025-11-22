import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useNFCe() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Emitir NFC-e
  const emitNFCe = async (data: any) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('emit-nfce', {
        body: data
      });

      if (error) throw error;

      if (result.success) {
        toast({
          title: "NFC-e emitida com sucesso!",
          description: `Número: ${result.data.numero}`,
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao emitir NFC-e');
      }
    } catch (error: any) {
      console.error('Erro ao emitir NFC-e:', error);
      toast({
        title: "Erro ao emitir NFC-e",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar NFC-e
  const cancelNFCe = async (nfceId: string, reason: string) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('cancel-nfce', {
        body: { nfceId, reason }
      });

      if (error) throw error;

      if (result.success) {
        toast({
          title: "NFC-e cancelada com sucesso!",
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao cancelar NFC-e');
      }
    } catch (error: any) {
      console.error('Erro ao cancelar NFC-e:', error);
      toast({
        title: "Erro ao cancelar NFC-e",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Consultar status
  const queryNFCeStatus = async (nfceId: string) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('query-nfce-status', {
        body: { nfceId }
      });

      if (error) throw error;

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erro ao consultar status');
      }
    } catch (error: any) {
      console.error('Erro ao consultar status:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    emitNFCe,
    cancelNFCe,
    queryNFCeStatus
  };
}
