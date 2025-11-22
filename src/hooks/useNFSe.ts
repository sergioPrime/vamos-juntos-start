import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface NFSe {
  id: string;
  org_id: string;
  fiscal_config_id: string;
  numero: number;
  serie: string;
  tomador_nome: string;
  tomador_cpf_cnpj: string;
  tomador_email?: string;
  codigo_servico: string;
  discriminacao: string;
  valor_servicos: number;
  valor_iss: number;
  valor_liquido: number;
  aliquota_iss: number;
  status: 'pendente' | 'processando' | 'autorizada' | 'cancelada' | 'rejeitada';
  data_emissao: string;
  data_competencia: string;
  protocolo?: string;
  codigo_verificacao?: string;
  link_visualizacao?: string;
  mensagem_retorno?: string;
  created_at: string;
  created_by: string;
}

export function useNFSe() {
  const { currentOrg } = useOrganization();
  const [nfseList, setNfseList] = useState<NFSe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNFSe = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nfse')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('numero', { ascending: false });

      if (error) throw error;
      setNfseList((data || []) as NFSe[]);
    } catch (error: any) {
      console.error('Erro ao carregar NFS-e:', error);
      toast.error('Erro ao carregar NFS-e');
    } finally {
      setLoading(false);
    }
  };

  const emitirNFSe = async (data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('emitir-nfse', {
        body: data,
      });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao emitir NFS-e');
      }

      toast.success('NFS-e emitida com sucesso');
      await loadNFSe();
      return result.nfse;
    } catch (error: any) {
      console.error('Erro ao emitir NFS-e:', error);
      toast.error(error.message || 'Erro ao emitir NFS-e');
      throw error;
    }
  };

  const cancelarNFSe = async (id: string, motivo: string) => {
    try {
      const { error } = await supabase
        .from('nfse')
        .update({
          status: 'cancelada',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: motivo,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('NFS-e cancelada com sucesso');
      await loadNFSe();
    } catch (error: any) {
      console.error('Erro ao cancelar NFS-e:', error);
      toast.error('Erro ao cancelar NFS-e');
      throw error;
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadNFSe();
    }
  }, [currentOrg]);

  return {
    nfseList,
    loading,
    emitirNFSe,
    cancelarNFSe,
    refetch: loadNFSe,
  };
}
