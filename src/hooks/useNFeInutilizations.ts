import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface NFeInutilization {
  id: string;
  org_id: string;
  fiscal_config_id: string;
  serie: string;
  numero_inicial: number;
  numero_final: number;
  justificativa: string;
  ano: number;
  modelo: string;
  protocolo?: string;
  data_inutilizacao?: string;
  status: 'pendente' | 'processando' | 'inutilizado' | 'rejeitado';
  mensagem_sefaz?: string;
  chave_inutilizacao?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export function useNFeInutilizations() {
  const { currentOrg } = useOrganization();
  const [inutilizations, setInutilizations] = useState<NFeInutilization[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInutilizations = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nfe_inutilizacoes')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInutilizations((data || []) as NFeInutilization[]);
    } catch (error: any) {
      console.error('Erro ao carregar inutilizações:', error);
      toast.error('Erro ao carregar inutilizações');
    } finally {
      setLoading(false);
    }
  };

  const createInutilization = async (data: {
    fiscalConfigId: string;
    serie: string;
    numeroInicial: number;
    numeroFinal: number;
    justificativa: string;
    ano: number;
  }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('inutilizar-numeracao-nfe', {
        body: data,
      });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao inutilizar numeração');
      }

      toast.success('Numeração inutilizada com sucesso');
      await loadInutilizations();
      return result.inutilization;
    } catch (error: any) {
      console.error('Erro ao inutilizar numeração:', error);
      toast.error(error.message || 'Erro ao inutilizar numeração');
      throw error;
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadInutilizations();
    }
  }, [currentOrg]);

  return {
    inutilizations,
    loading,
    createInutilization,
    refetch: loadInutilizations,
  };
}
