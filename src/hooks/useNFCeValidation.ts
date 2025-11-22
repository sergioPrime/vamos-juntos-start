import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

interface ValidationResult {
  is_valid: boolean;
  errors: string[];
}

export function useNFCeValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrganization();

  const validateNFCeEmission = useCallback(async () => {
    if (!currentOrg) return null;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('validate_nfce_emission', {
        p_org_id: currentOrg.id,
      });

      if (error) throw error;

      const result = data?.[0] || { is_valid: false, errors: ['Erro ao validar configuração'] };
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Erro ao validar emissão de NFC-e:', error);
      const errorResult = {
        is_valid: false,
        errors: ['Erro ao validar configuração. Tente novamente.'],
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (currentOrg) {
      validateNFCeEmission();
    }
  }, [currentOrg, validateNFCeEmission]);

  return {
    validationResult,
    loading,
    validateNFCeEmission,
    isValid: validationResult?.is_valid ?? false,
    errors: validationResult?.errors ?? [],
  };
}
