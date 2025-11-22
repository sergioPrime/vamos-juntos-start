import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const useNFCeContingency = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  const { data: contingencyActive } = useQuery({
    queryKey: ["nfce-contingency", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return false;

      const { data, error } = await supabase
        .from("fiscal_config")
        .select("nfce_contingencia_ativa")
        .eq("org_id", currentOrg.id)
        .single();

      if (error) return false;
      return data?.nfce_contingencia_ativa || false;
    },
    enabled: !!currentOrg?.id,
  });

  const { data: queuedNFCes } = useQuery({
    queryKey: ["nfce-queue", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("nfce_contingency_queue")
        .select("*")
        .eq("org_id", currentOrg.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) return [];
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const activateContingency = useMutation({
    mutationFn: async (reason: string) => {
      if (!currentOrg?.id) throw new Error("Organização não encontrada");

      const { error } = await supabase
        .from("fiscal_config")
        .update({
          nfce_contingencia_ativa: true,
          data_inicio_contingencia: new Date().toISOString(),
          motivo_contingencia: reason,
        })
        .eq("org_id", currentOrg.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfce-contingency"] });
      toast.success("Contingência ativada");
    },
    onError: (error: any) => {
      toast.error(`Erro ao ativar contingência: ${error.message}`);
    },
  });

  const deactivateContingency = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error("Organização não encontrada");

      const { error } = await supabase
        .from("fiscal_config")
        .update({
          nfce_contingencia_ativa: false,
          data_inicio_contingencia: null,
          motivo_contingencia: null,
        })
        .eq("org_id", currentOrg.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfce-contingency"] });
      toast.success("Contingência desativada");
    },
    onError: (error: any) => {
      toast.error(`Erro ao desativar contingência: ${error.message}`);
    },
  });

  const addToQueue = useMutation({
    mutationFn: async (nfceData: any) => {
      if (!currentOrg?.id) throw new Error("Organização não encontrada");

      const { error } = await supabase.from("nfce_contingency_queue").insert({
        org_id: currentOrg.id,
        nfce_data: nfceData,
        status: "pending",
        retry_count: 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfce-queue"] });
      toast.success("NFC-e adicionada à fila de contingência");
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar à fila: ${error.message}`);
    },
  });

  const transmitQueue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("transmit-nfce-queue");

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nfce-queue"] });
      queryClient.invalidateQueries({ queryKey: ["nfces"] });
      toast.success(`${data.transmitted} NFC-e(s) transmitidas com sucesso`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao transmitir fila: ${error.message}`);
    },
  });

  const removeFromQueue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nfce_contingency_queue")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfce-queue"] });
      toast.success("Item removido da fila");
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover da fila: ${error.message}`);
    },
  });

  return {
    contingencyActive,
    queuedNFCes,
    activateContingency,
    deactivateContingency,
    addToQueue,
    transmitQueue,
    removeFromQueue,
  };
};
