import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useOrganization } from './useOrganization';

export interface NFCe {
  id: string;
  org_id: string;
  company_id: string | null;
  numero: number;
  serie: string;
  modelo: string;
  data_emissao: string;
  data_saida: string | null;
  destinatario_tipo: string;
  destinatario_nome: string | null;
  destinatario_documento: string | null;
  destinatario_email: string | null;
  destinatario_telefone: string | null;
  valor_produtos: number;
  valor_total: number;
  forma_pagamento: string | null;
  troco: number;
  status: string;
  chave_acesso: string | null;
  protocolo_autorizacao: string | null;
  data_autorizacao: string | null;
  qr_code: string | null;
  url_consulta: string | null;
  natureza_operacao: string;
  presenca_comprador: string;
  order_id: string | null;
  caixa_sessao_id: string | null;
  created_at: string;
}

export interface NFCeItem {
  id?: string;
  product_id?: string;
  codigo_produto: string;
  descricao: string;
  ncm?: string;
  cest?: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_desconto?: number;
  cfop: string;
  icms_origem?: string;
  icms_cst?: string;
  icms_aliquota?: number;
  ipi_cst?: string;
  ipi_aliquota?: number;
  pis_cst?: string;
  pis_aliquota?: number;
  cofins_cst?: string;
  cofins_aliquota?: number;
  ibs_uf_aliquota?: number;
  ibs_mun_aliquota?: number;
  cbs_aliquota?: number;
  is_aliquota?: number;
}

export function useNFCe() {
  const [nfceList, setNfceList] = useState<NFCe[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const loadNFCe = useCallback(async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNfceList(data || []);
    } catch (error) {
      console.error('Erro ao carregar NFC-e:', error);
      toast({
        title: 'Erro ao carregar NFC-e',
        description: 'Não foi possível carregar a lista de NFC-e.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrg, toast]);

  const emitirNFCe = useCallback(
    async (data: {
      destinatario?: {
        tipo?: string;
        nome?: string;
        documento?: string;
        email?: string;
        telefone?: string;
        endereco?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
        cep?: string;
      };
      items: NFCeItem[];
      forma_pagamento: string;
      troco?: number;
      natureza_operacao?: string;
      presenca_comprador?: string;
      informacoes_complementares?: string;
      order_id?: string;
      caixa_sessao_id?: string;
    }) => {
      try {
        setLoading(true);

        const { data: result, error } = await supabase.functions.invoke('emitir-nfce', {
          body: data,
        });

        if (error) throw error;

        if (result.success) {
          toast({
            title: 'NFC-e emitida com sucesso',
            description: `NFC-e #${result.nfce.numero} autorizada.`,
          });

          await loadNFCe();
          return result.nfce;
        } else {
          throw new Error(result.error || 'Erro ao emitir NFC-e');
        }
      } catch (error: any) {
        console.error('Erro ao emitir NFC-e:', error);
        toast({
          title: 'Erro ao emitir NFC-e',
          description: error.message || 'Não foi possível emitir a NFC-e.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadNFCe, toast]
  );

  const cancelarNFCe = useCallback(
    async (nfceId: string, justificativa: string) => {
      try {
        setLoading(true);

        // Buscar NFC-e
        const { data: nfce, error: fetchError } = await supabase
          .from('nfce')
          .select('*')
          .eq('id', nfceId)
          .single();

        if (fetchError) throw fetchError;

        if (nfce.status !== 'autorizada') {
          throw new Error('Apenas NFC-e autorizadas podem ser canceladas');
        }

        // Simular cancelamento na SEFAZ
        const protocolo = `${Math.floor(Math.random() * 900000000000000 + 100000000000000)}`;

        // Atualizar NFC-e
        const { error: updateError } = await supabase
          .from('nfce')
          .update({
            status: 'cancelada',
            data_cancelamento: new Date().toISOString(),
            protocolo_cancelamento: protocolo,
            justificativa_cancelamento: justificativa,
          })
          .eq('id', nfceId);

        if (updateError) throw updateError;

        toast({
          title: 'NFC-e cancelada',
          description: 'A NFC-e foi cancelada com sucesso.',
        });

        await loadNFCe();
      } catch (error: any) {
        console.error('Erro ao cancelar NFC-e:', error);
        toast({
          title: 'Erro ao cancelar NFC-e',
          description: error.message || 'Não foi possível cancelar a NFC-e.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadNFCe, toast]
  );

  useEffect(() => {
    loadNFCe();
  }, [loadNFCe]);

  return {
    nfceList,
    loading,
    loadNFCe,
    emitirNFCe,
    cancelarNFCe,
  };
}
