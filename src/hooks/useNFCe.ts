import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export const useNFCe = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  const { data: nfces, isLoading } = useQuery({
    queryKey: ["nfces", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("nfce")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const emitNFCe = useMutation({
    mutationFn: async (nfceData: any) => {
      const { data, error } = await supabase.functions.invoke("emit-nfce", {
        body: { nfce_data: nfceData },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfces"] });
      toast.success("NFC-e emitida com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao emitir NFC-e: ${error.message}`);
    },
  });

  const cancelNFCe = useMutation({
    mutationFn: async ({ id, justification }: { id: string; justification: string }) => {
      const { data, error } = await supabase.functions.invoke("cancel-nfce", {
        body: { nfce_id: id, justification },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfces"] });
      toast.success("NFC-e cancelada com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao cancelar NFC-e: ${error.message}`);
    },
  });

  const consultStatus = useMutation({
    mutationFn: async (nfceId: string) => {
      const { data, error } = await supabase.functions.invoke("consult-nfce-status", {
        body: { nfce_id: nfceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfces"] });
      toast.success("Status consultado com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao consultar status: ${error.message}`);
    },
  });

  return {
    nfces,
    isLoading,
    emitNFCe,
    cancelNFCe,
    consultStatus,
  };
};
