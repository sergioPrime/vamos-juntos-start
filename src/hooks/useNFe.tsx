import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useToast } from "./use-toast";

export interface NFe {
  id: string;
  org_id: string;
  company_id?: string;
  numero: number;
  serie: string;
  modelo: string;
  chave_acesso?: string;
  numero_protocolo?: string;
  natureza_operacao: string;
  tipo_operacao: string;
  finalidade: string;
  destinatario_id?: string;
  destinatario_nome: string;
  destinatario_cpf_cnpj: string;
  destinatario_ie?: string;
  destinatario_endereco: string;
  destinatario_numero: string;
  destinatario_complemento?: string;
  destinatario_bairro: string;
  destinatario_cidade: string;
  destinatario_uf: string;
  destinatario_cep: string;
  destinatario_telefone?: string;
  destinatario_email?: string;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outras_despesas: number;
  bc_icms: number;
  valor_icms: number;
  valor_icms_st: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_total: number;
  informacoes_complementares?: string;
  informacoes_fisco?: string;
  order_id?: string;
  status: "pendente" | "autorizada" | "cancelada" | "rejeitada" | "inutilizada";
  motivo_rejeicao?: string;
  data_emissao: string;
  data_saida_entrada?: string;
  data_autorizacao?: string;
  data_cancelamento?: string;
  motivo_cancelamento?: string;
  xml_gerado?: string;
  xml_autorizado?: string;
  protocolo_cancelamento?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NFItem {
  id?: string;
  nfe_id?: string;
  org_id?: string;
  product_id?: string;
  item_numero: number;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cest?: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_desconto: number;
  valor_frete: number;
  valor_seguro: number;
  valor_outras_despesas: number;
  icms_origem: string;
  icms_cst: string;
  icms_modalidade_bc?: string;
  icms_bc: number;
  icms_aliquota: number;
  icms_valor: number;
  icms_st_bc: number;
  icms_st_aliquota: number;
  icms_st_valor: number;
  ipi_cst?: string;
  ipi_bc: number;
  ipi_aliquota: number;
  ipi_valor: number;
  pis_cst: string;
  pis_bc: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_cst: string;
  cofins_bc: number;
  cofins_aliquota: number;
  cofins_valor: number;
  informacoes_adicionais?: string;
}

export interface CreateNFeData {
  company_id?: string;
  serie?: string;
  natureza_operacao: string;
  tipo_operacao: string;
  finalidade: string;
  destinatario_id?: string;
  destinatario_nome: string;
  destinatario_cpf_cnpj: string;
  destinatario_ie?: string;
  destinatario_endereco: string;
  destinatario_numero: string;
  destinatario_complemento?: string;
  destinatario_bairro: string;
  destinatario_cidade: string;
  destinatario_uf: string;
  destinatario_cep: string;
  destinatario_telefone?: string;
  destinatario_email?: string;
  informacoes_complementares?: string;
  informacoes_fisco?: string;
  order_id?: string;
  items: NFItem[];
}

export function useNFe() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as NFe
  const { data: nfeList, isLoading } = useQuery({
    queryKey: ["nfe", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("nfe")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("data_emissao", { ascending: false });

      if (error) throw error;
      return data as NFe[];
    },
    enabled: !!currentOrg?.id,
  });

  // Buscar NFe por ID
  const getNFeById = async (id: string): Promise<NFe | null> => {
    if (!currentOrg?.id) return null;

    const { data, error } = await supabase
      .from("nfe")
      .select("*")
      .eq("id", id)
      .eq("org_id", currentOrg.id)
      .maybeSingle();

    if (error) throw error;
    return data as NFe | null;
  };

  // Criar NFe
  const createNFe = useMutation({
    mutationFn: async (nfeData: CreateNFeData) => {
      if (!currentOrg?.id) throw new Error("Organização não encontrada");

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Separar itens dos dados da NFe
      const { items, ...nfeFields } = nfeData;

      // Criar NFe
      const { data: nfe, error: nfeError } = await supabase
        .from("nfe")
        .insert({
          ...nfeFields,
          org_id: currentOrg.id,
          created_by: user.user.id,
        })
        .select()
        .maybeSingle();

      if (nfeError || !nfe) throw nfeError || new Error("Erro ao criar NFe");

      // Criar itens da NFe
      if (items && items.length > 0) {
        const nfeItems = items.map((item, index) => {
          const { id, nfe_id, org_id, ...itemData } = item;
          return {
            ...itemData,
            nfe_id: nfe.id,
            org_id: currentOrg.id,
            item_numero: index + 1,
          };
        });

        const { error: itemsError } = await supabase
          .from("nfe_items")
          .insert(nfeItems);

        if (itemsError) throw itemsError;
      }

      return nfe as NFe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "NFe criada com sucesso!",
        description: "A nota fiscal foi salva e está pendente de autorização.",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar NFe:", error);
      toast({
        title: "Erro ao criar NFe",
        description: "Ocorreu um erro ao salvar a nota fiscal.",
        variant: "destructive",
      });
    },
  });

  // Atualizar NFe
  const updateNFe = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NFe> }) => {
      const { error } = await supabase
        .from("nfe")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "NFe atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar NFe:", error);
      toast({
        title: "Erro ao atualizar NFe",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  // Deletar NFe (apenas pendentes)
  const deleteNFe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nfe").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "NFe excluída",
        description: "A nota fiscal foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar NFe:", error);
      toast({
        title: "Erro ao excluir NFe",
        description: "Ocorreu um erro ao remover a nota fiscal.",
        variant: "destructive",
      });
    },
  });

  // Autorizar NFe (placeholder - integração com SEFAZ)
  const authorizeNFe = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implementar integração com SEFAZ
      // Por enquanto, apenas simula a autorização
      const { error } = await supabase
        .from("nfe")
        .update({
          status: "autorizada" as const,
          data_autorizacao: new Date().toISOString(),
          chave_acesso: `35${new Date().getFullYear()}${Math.random().toString().slice(2, 46)}`,
          numero_protocolo: Math.random().toString().slice(2, 17),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "NFe autorizada!",
        description: "A nota fiscal foi autorizada pela SEFAZ.",
      });
    },
    onError: (error) => {
      console.error("Erro ao autorizar NFe:", error);
      toast({
        title: "Erro ao autorizar NFe",
        description: "Ocorreu um erro na comunicação com a SEFAZ.",
        variant: "destructive",
      });
    },
  });

  // Cancelar NFe
  const cancelNFe = useMutation({
    mutationFn: async ({
      id,
      motivo,
    }: {
      id: string;
      motivo: string;
    }) => {
      // TODO: Implementar integração com SEFAZ
      const { error } = await supabase
        .from("nfe")
        .update({
          status: "cancelada" as const,
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "NFe cancelada",
        description: "A nota fiscal foi cancelada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao cancelar NFe:", error);
      toast({
        title: "Erro ao cancelar NFe",
        description: "Ocorreu um erro ao cancelar a nota fiscal.",
        variant: "destructive",
      });
    },
  });

  return {
    nfeList,
    isLoading,
    getNFeById,
    createNFe,
    updateNFe,
    deleteNFe,
    authorizeNFe,
    cancelNFe,
  };
}
