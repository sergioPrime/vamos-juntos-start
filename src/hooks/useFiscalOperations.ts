import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CFOPCode {
  code: string;
  description: string;
}

export interface FiscalOperation {
  id: string;
  org_id: string;
  tax_group_id: string;
  operation_name: string;
  destination_state: string;
  pis_situation: string;
  cofins_situation: string;
  additional_info: string | null;
  icms_situation: string | null;
  sum_ipi_on_base: boolean;
  show_icms_st_on_invoice: boolean;
  interstate_icms_rate: number;
  internal_icms_rate: number;
  fcp_rate: number;
  calculate_base_inside: boolean;
  effective_icms_bc_reduction: number;
  effective_icms_rate: number;
  ipi_situation_suframa: string | null;
  ipi_situation_general: string | null;
  ipi_rate_suframa: number;
  ipi_rate_general: number;
  ex_tipi_suframa: string | null;
  ex_tipi_general: string | null;
  ipi_class_suframa: string | null;
  ipi_class_general: string | null;
  cfop_codes: CFOPCode[];
  fiscal_benefit: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useFiscalOperations() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const [fiscalOperations, setFiscalOperations] = useState<FiscalOperation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiscalOperations = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_operations')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('operation_name');

      if (error) throw error;
      setFiscalOperations(data as any || []);
    } catch (error: any) {
      console.error('Erro ao carregar operações fiscais:', error);
      toast.error('Erro ao carregar operações fiscais');
    } finally {
      setLoading(false);
    }
  };

  const createFiscalOperation = async (data: Partial<FiscalOperation>) => {
    if (!currentOrg || !user) return;

    try {
      const { error } = await supabase
        .from('fiscal_operations')
        .insert({
          ...data,
          org_id: currentOrg.id,
          created_by: user.id,
        } as any);

      if (error) throw error;
      toast.success('Operação fiscal criada com sucesso');
      await loadFiscalOperations();
    } catch (error: any) {
      console.error('Erro ao criar operação fiscal:', error);
      toast.error('Erro ao criar operação fiscal');
      throw error;
    }
  };

  const updateFiscalOperation = async (id: string, data: Partial<FiscalOperation>) => {
    try {
      const { error } = await supabase
        .from('fiscal_operations')
        .update(data as any)
        .eq('id', id);

      if (error) throw error;
      toast.success('Operação fiscal atualizada com sucesso');
      await loadFiscalOperations();
    } catch (error: any) {
      console.error('Erro ao atualizar operação fiscal:', error);
      toast.error('Erro ao atualizar operação fiscal');
      throw error;
    }
  };

  const deleteFiscalOperation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Operação fiscal excluída com sucesso');
      await loadFiscalOperations();
    } catch (error: any) {
      console.error('Erro ao excluir operação fiscal:', error);
      toast.error('Erro ao excluir operação fiscal');
      throw error;
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadFiscalOperations();
    }
  }, [currentOrg]);

  return {
    fiscalOperations,
    loading,
    createFiscalOperation,
    updateFiscalOperation,
    deleteFiscalOperation,
    refetch: loadFiscalOperations,
  };
}
