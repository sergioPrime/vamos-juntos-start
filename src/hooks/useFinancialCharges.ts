import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface InstallmentCharges {
  original_amount: number;
  late_fee: number;
  interest_amount: number;
  discount_amount: number;
  final_amount: number;
  days_late: number;
  days_early: number;
}

export interface PaymentSimulation extends InstallmentCharges {
  installment_number: number;
  due_date: string;
  payment_date: string;
  total_charges: number;
  total_discount: number;
}

export interface OverdueInstallment {
  installment_id: string;
  entry_id: string;
  installment_number: number;
  total_installments: number;
  due_date: string;
  days_overdue: number;
  original_amount: number;
  late_fee: number;
  interest_amount: number;
  final_amount: number;
  person_name: string;
  entry_type: string;
}

export interface FinancialConfig {
  late_fee_percentage: number;
  daily_interest_percentage: number;
  early_discount_percentage: number;
  early_discount_days: number;
}

export interface SettleWithChargesResult {
  success: boolean;
  original_amount: number;
  late_fee: number;
  interest_amount: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export function useFinancialCharges() {
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);

  const calculateCharges = async (
    installmentId: string,
    paymentDate: string = new Date().toISOString().split('T')[0]
  ): Promise<InstallmentCharges | null> => {
    try {
      const { data, error } = await supabase.rpc('calculate_installment_charges', {
        p_installment_id: installmentId,
        p_payment_date: paymentDate
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Erro ao calcular encargos:', error);
      toast.error('Erro ao calcular encargos');
      return null;
    }
  };

  const settleWithCharges = async (
    installmentId: string,
    paymentDate: string = new Date().toISOString().split('T')[0],
    paymentMethodId?: string,
    bankAccountId?: string,
    customAmount?: number
  ): Promise<SettleWithChargesResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('settle_installment_with_charges', {
        p_installment_id: installmentId,
        p_payment_date: paymentDate,
        p_payment_method_id: paymentMethodId || null,
        p_bank_account_id: bankAccountId || null,
        p_custom_amount: customAmount || null
      });

      if (error) throw error;

      const result = data && data.length > 0 ? data[0] : null;
      if (result?.success) {
        toast.success(result.message);
      } else {
        toast.error(result?.message || 'Erro ao quitar parcela');
      }

      return result;
    } catch (error: any) {
      console.error('Erro ao quitar parcela com encargos:', error);
      toast.error(error.message || 'Erro ao quitar parcela');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (
    installmentId: string,
    paymentDate: string = new Date().toISOString().split('T')[0]
  ): Promise<PaymentSimulation | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('simulate_installment_payment', {
        p_installment_id: installmentId,
        p_payment_date: paymentDate
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Erro ao simular pagamento:', error);
      toast.error('Erro ao simular pagamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getOverdueInstallments = async (
    referenceDate: string = new Date().toISOString().split('T')[0]
  ): Promise<OverdueInstallment[]> => {
    if (!currentOrg?.id) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_overdue_installments_with_charges', {
        p_org_id: currentOrg.id,
        p_reference_date: referenceDate
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao buscar parcelas vencidas:', error);
      toast.error('Erro ao buscar parcelas vencidas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateFinancialConfig = async (config: Partial<FinancialConfig>): Promise<boolean> => {
    if (!currentOrg?.id) {
      toast.error('Organização não identificada');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_organization_financial_config', {
        p_org_id: currentOrg.id,
        p_late_fee_percentage: config.late_fee_percentage || null,
        p_daily_interest_percentage: config.daily_interest_percentage || null,
        p_early_discount_percentage: config.early_discount_percentage || null,
        p_early_discount_days: config.early_discount_days || null
      });

      if (error) throw error;

      toast.success('Configurações atualizadas com sucesso');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error(error.message || 'Erro ao atualizar configurações');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getFinancialConfig = async (): Promise<FinancialConfig | null> => {
    if (!currentOrg?.id) return null;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('default_late_fee_percentage, default_daily_interest_percentage, default_early_discount_percentage, default_early_discount_days')
        .eq('id', currentOrg.id)
        .single();

      if (error) throw error;

      return {
        late_fee_percentage: data.default_late_fee_percentage || 2.00,
        daily_interest_percentage: data.default_daily_interest_percentage || 0.033,
        early_discount_percentage: data.default_early_discount_percentage || 0.00,
        early_discount_days: data.default_early_discount_days || 0
      };
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  };

  return {
    loading,
    calculateCharges,
    settleWithCharges,
    simulatePayment,
    getOverdueInstallments,
    updateFinancialConfig,
    getFinancialConfig
  };
}
