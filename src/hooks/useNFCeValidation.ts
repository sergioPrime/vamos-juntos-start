import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  is_valid: boolean;
  errors: string[];
}

/**
 * Hook for validating NFC-e configuration
 */
export function useNFCeValidation(orgId: string) {
  const { data: validation, isLoading, error } = useQuery({
    queryKey: ['nfce-validation', orgId],
    queryFn: async (): Promise<ValidationResult> => {
      const { data, error } = await supabase
        .rpc('validate_nfce_emission', { p_org_id: orgId });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          is_valid: false,
          errors: ['Configuração fiscal não encontrada'],
        };
      }

      return {
        is_valid: data[0].is_valid,
        errors: data[0].errors || [],
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    validation,
    isLoading,
    error,
  };
}
