import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFiscalConfig() {
  return useQuery({
    queryKey: ["fiscal-config"],
    queryFn: async () => {
      const { data: orgData } = await supabase
        .from("user_organizations")
        .select("org_id")
        .single();

      if (!orgData) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .eq("org_id", orgData.org_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}