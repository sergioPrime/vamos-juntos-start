import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface Installment {
  id: string;
  org_id: string;
  entry_id: string;
  installment_number: number;
  total_installments: number;
  due_date: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
  settled_amount: number | null;
  payment_method_id: string | null;
  bank_account_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface InstallmentsSummary {
  total_installments: number;
  settled_installments: number;
  pending_installments: number;
  total_amount: number;
  settled_amount: number;
  pending_amount: number;
  next_due_date: string | null;
}

export interface GenerateInstallmentsParams {
  entryId: string;
  numInstallments: number;
  firstDueDate: string;
  totalAmount: number;
}

export function useInstallments() {
  const { currentOrg } = useOrganization();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInstallments = async (entryId: string) => {
    if (!currentOrg?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_entry_installments')
        .select('*')
        .eq('entry_id', entryId)
        .eq('org_id', currentOrg.id)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar parcelas:', error);
      toast.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  };

  const generateInstallments = async ({
    entryId,
    numInstallments,
    firstDueDate,
    totalAmount
  }: GenerateInstallmentsParams): Promise<boolean> => {
    if (!currentOrg?.id) {
      toast.error('Organização não identificada');
      return false;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('generate_installments', {
        p_entry_id: entryId,
        p_num_installments: numInstallments,
        p_first_due_date: firstDueDate,
        p_total_amount: totalAmount,
        p_org_id: currentOrg.id,
        p_created_by: user.id
      });

      if (error) throw error;

      toast.success(`${numInstallments} parcelas geradas com sucesso`);
      await loadInstallments(entryId);
      return true;
    } catch (error: any) {
      console.error('Erro ao gerar parcelas:', error);
      toast.error(error.message || 'Erro ao gerar parcelas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const settleInstallment = async (
    installmentId: string,
    settledAmount: number,
    paymentMethodId?: string,
    bankAccountId?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('settle_installment', {
        p_installment_id: installmentId,
        p_settled_amount: settledAmount,
        p_payment_method_id: paymentMethodId || null,
        p_bank_account_id: bankAccountId || null
      });

      if (error) throw error;

      toast.success('Parcela quitada com sucesso');
      
      // Recarrega as parcelas
      const installment = installments.find(i => i.id === installmentId);
      if (installment) {
        await loadInstallments(installment.entry_id);
      }
      
      return true;
    } catch (error: any) {
      console.error('Erro ao quitar parcela:', error);
      toast.error(error.message || 'Erro ao quitar parcela');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsettleInstallment = async (installmentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('unsettle_installment', {
        p_installment_id: installmentId
      });

      if (error) throw error;

      toast.success('Quitação cancelada com sucesso');
      
      // Recarrega as parcelas
      const installment = installments.find(i => i.id === installmentId);
      if (installment) {
        await loadInstallments(installment.entry_id);
      }
      
      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar quitação:', error);
      toast.error(error.message || 'Erro ao cancelar quitação');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentsSummary = async (entryId: string): Promise<InstallmentsSummary | null> => {
    try {
      const { data, error } = await supabase.rpc('get_installments_summary', {
        p_entry_id: entryId
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Erro ao obter resumo de parcelas:', error);
      toast.error('Erro ao obter resumo de parcelas');
      return null;
    }
  };

  const deleteInstallment = async (installmentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('financial_entry_installments')
        .delete()
        .eq('id', installmentId);

      if (error) throw error;

      toast.success('Parcela excluída com sucesso');
      
      // Recarrega as parcelas
      const installment = installments.find(i => i.id === installmentId);
      if (installment) {
        await loadInstallments(installment.entry_id);
      }
      
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir parcela:', error);
      toast.error(error.message || 'Erro ao excluir parcela');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    installments,
    loading,
    loadInstallments,
    generateInstallments,
    settleInstallment,
    unsettleInstallment,
    getInstallmentsSummary,
    deleteInstallment
  };
}
