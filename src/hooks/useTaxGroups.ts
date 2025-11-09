import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface TaxGroup {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTaxGroups() {
  const { currentOrg } = useOrganization();
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTaxGroups = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_groups')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('name');

      if (error) throw error;
      setTaxGroups(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar grupos tributários:', error);
      toast.error('Erro ao carregar grupos tributários');
    } finally {
      setLoading(false);
    }
  };

  const createTaxGroup = async (data: Partial<TaxGroup>) => {
    if (!currentOrg) return;

    try {
      const { error } = await supabase
        .from('tax_groups')
        .insert({
          ...data,
          org_id: currentOrg.id,
        } as any);

      if (error) throw error;
      toast.success('Grupo tributário criado com sucesso');
      await loadTaxGroups();
    } catch (error: any) {
      console.error('Erro ao criar grupo tributário:', error);
      toast.error('Erro ao criar grupo tributário');
      throw error;
    }
  };

  const updateTaxGroup = async (id: string, data: Partial<TaxGroup>) => {
    try {
      const { error } = await supabase
        .from('tax_groups')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast.success('Grupo tributário atualizado com sucesso');
      await loadTaxGroups();
    } catch (error: any) {
      console.error('Erro ao atualizar grupo tributário:', error);
      toast.error('Erro ao atualizar grupo tributário');
      throw error;
    }
  };

  const deleteTaxGroup = async (id: string) => {
    try {
      // Verificar se o grupo está vinculado a operações fiscais
      const { data: linkedOperations, error: checkError } = await supabase
        .from('fiscal_operations')
        .select('id')
        .eq('tax_group_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (linkedOperations && linkedOperations.length > 0) {
        toast.error('Este grupo tributário não pode ser excluído pois está vinculado a operações fiscais ativas. Desative-o ou remova os vínculos primeiro.');
        throw new Error('Grupo tributário vinculado a operações fiscais');
      }

      const { error } = await supabase
        .from('tax_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Grupo tributário excluído com sucesso');
      await loadTaxGroups();
    } catch (error: any) {
      console.error('Erro ao excluir grupo tributário:', error);
      if (error.message && !error.message.includes('Grupo tributário vinculado')) {
        toast.error('Erro ao excluir grupo tributário');
      }
      throw error;
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadTaxGroups();
    }
  }, [currentOrg]);

  return {
    taxGroups,
    loading,
    createTaxGroup,
    updateTaxGroup,
    deleteTaxGroup,
    refetch: loadTaxGroups,
  };
}
