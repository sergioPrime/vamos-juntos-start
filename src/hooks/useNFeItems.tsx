import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useToast } from "./use-toast";
import type { NFItem } from "./useNFe";

export function useNFeItems(nfeId?: string) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar itens da NFe
  const { data: items, isLoading } = useQuery({
    queryKey: ["nfe-items", nfeId],
    queryFn: async () => {
      if (!nfeId || !currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("nfe_items")
        .select("*")
        .eq("nfe_id", nfeId)
        .eq("org_id", currentOrg.id)
        .order("item_numero");

      if (error) throw error;
      return data as NFItem[];
    },
    enabled: !!nfeId && !!currentOrg?.id,
  });

  // Adicionar item
  const addItem = useMutation({
    mutationFn: async (item: NFItem) => {
      if (!nfeId || !currentOrg?.id) throw new Error("NFe não definida");

      const { data, error } = await supabase
        .from("nfe_items")
        .insert({
          ...item,
          nfe_id: nfeId,
          org_id: currentOrg.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-items", nfeId] });
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "Item adicionado",
        description: "O produto foi adicionado à nota fiscal.",
      });
    },
    onError: (error) => {
      console.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro ao adicionar item",
        description: "Ocorreu um erro ao adicionar o produto.",
        variant: "destructive",
      });
    },
  });

  // Atualizar item
  const updateItem = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NFItem>;
    }) => {
      const { error } = await supabase
        .from("nfe_items")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-items", nfeId] });
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "Item atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar item:", error);
      toast({
        title: "Erro ao atualizar item",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  // Remover item
  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nfe_items").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-items", nfeId] });
      queryClient.invalidateQueries({ queryKey: ["nfe"] });
      toast({
        title: "Item removido",
        description: "O produto foi removido da nota fiscal.",
      });
    },
    onError: (error) => {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro ao remover item",
        description: "Ocorreu um erro ao remover o produto.",
        variant: "destructive",
      });
    },
  });

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    removeItem,
  };
}
