import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type NFe = Database["public"]["Tables"]["nfe"]["Row"];
type NFeInsert = Database["public"]["Tables"]["nfe"]["Insert"];
type NFeUpdate = Database["public"]["Tables"]["nfe"]["Update"];

export function useNFe() {
  const queryClient = useQueryClient();

  const { data: nfeList, isLoading } = useQuery({
    queryKey: ["nfe-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfe")
        .select(`
          *,
          pessoas:destinatario_id(nome),
          companies:company_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (NFe & { 
        pessoas: { nome: string } | null;
        companies: { name: string } | null;
      })[];
    },
  });

  const createNFe = useMutation({
    mutationFn: async (data: NFeInsert) => {
      const { data: nfe, error } = await supabase
        .from("nfe")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return nfe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-list"] });
      toast.success("NFe salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar NFe: ${error.message}`);
    },
  });

  const updateNFe = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NFeUpdate }) => {
      const { data: nfe, error } = await supabase
        .from("nfe")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return nfe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-list"] });
      toast.success("NFe atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar NFe: ${error.message}`);
    },
  });

  const deleteNFe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nfe").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-list"] });
      toast.success("NFe excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir NFe: ${error.message}`);
    },
  });

  const getNFeById = async (id: string) => {
    const { data, error } = await supabase
      .from("nfe")
      .select(`
        *,
        nfe_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    nfeList: nfeList || [],
    isLoading,
    createNFe: createNFe.mutate,
    updateNFe: updateNFe.mutate,
    deleteNFe: deleteNFe.mutate,
    getNFeById,
    isCreating: createNFe.isPending,
    isUpdating: updateNFe.isPending,
  };
}
