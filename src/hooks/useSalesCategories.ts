import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export interface SalesCategory {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  moves_stock: boolean;
  moves_financial: boolean;
  visible_in_fiscal_operations: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useSalesCategories() {
  const { currentOrg } = useOrganization();
  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSalesCategories = async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales_categories")
        .select("*")
        .eq("org_id", currentOrg.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSalesCategories(data || []);
    } catch (error) {
      console.error("Error loading sales categories:", error);
      setSalesCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const createSalesCategory = async (data: Partial<SalesCategory>) => {
    if (!currentOrg?.id) return;

    try {
      const { error } = await supabase.from("sales_categories").insert({
        ...data,
        org_id: currentOrg.id,
      } as any);

      if (error) throw error;
      await loadSalesCategories();
    } catch (error) {
      console.error("Error creating sales category:", error);
      throw error;
    }
  };

  const updateSalesCategory = async (id: string, data: Partial<SalesCategory>) => {
    try {
      const { error } = await supabase
        .from("sales_categories")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      await loadSalesCategories();
    } catch (error) {
      console.error("Error updating sales category:", error);
      throw error;
    }
  };

  const deleteSalesCategory = async (id: string) => {
    try {
      // Verificar se a categoria está vinculada a operações fiscais
      const { data: linkedOperations, error: checkError } = await supabase
        .from('fiscal_operations')
        .select('id')
        .eq('sales_category_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (linkedOperations && linkedOperations.length > 0) {
        toast.error('Esta categoria de vendas não pode ser excluída pois está vinculada a operações fiscais ativas. Desative-a ou remova os vínculos primeiro.');
        throw new Error('Categoria de vendas vinculada a operações fiscais');
      }

      const { error } = await supabase
        .from("sales_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      toast.success('Categoria de vendas removida com sucesso');
      await loadSalesCategories();
    } catch (error: any) {
      console.error("Error deleting sales category:", error);
      if (error.message && !error.message.includes('Categoria de vendas vinculada')) {
        toast.error('Erro ao remover categoria');
      }
      throw error;
    }
  };

  useEffect(() => {
    loadSalesCategories();
  }, [currentOrg]);

  return {
    salesCategories,
    loading,
    createSalesCategory,
    updateSalesCategory,
    deleteSalesCategory,
    refetch: loadSalesCategories,
  };
}
