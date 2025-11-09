import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

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
      const { error } = await supabase
        .from("sales_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      await loadSalesCategories();
    } catch (error) {
      console.error("Error deleting sales category:", error);
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
