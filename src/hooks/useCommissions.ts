import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

export interface Commission {
  id: string;
  seller_id: string;
  seller_name?: string;
  order_id: string;
  order_number?: string;
  commission_type: 'percentage' | 'fixed' | 'tiered';
  commission_rate: number;
  commission_amount: number;
  base_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
}

export interface CommissionRule {
  id: string;
  rule_name: string;
  rule_type: 'product' | 'category' | 'seller' | 'global';
  target_id?: string;
  commission_type: 'percentage' | 'fixed' | 'tiered';
  commission_value: number;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  priority: number;
}

export const useCommissions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const calculateCommission = async (
    orderId: string,
    sellerId: string,
    orderAmount: number
  ): Promise<Commission | null> => {
    if (!currentOrg) return null;

    try {
      // Busca regras aplicáveis
      const { data: rules, error: rulesError } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      // Aplica primeira regra compatível
      let commissionAmount = 0;
      let commissionRate = 0;
      let commissionType: 'percentage' | 'fixed' | 'tiered' = 'percentage';

      if (rules && rules.length > 0) {
        const rule = rules[0];
        commissionType = rule.commission_type as any;
        commissionRate = rule.commission_value;

        if (commissionType === 'percentage') {
          commissionAmount = orderAmount * (commissionRate / 100);
        } else if (commissionType === 'fixed') {
          commissionAmount = commissionRate;
        } else if (commissionType === 'tiered') {
          // Lógica escalonada básica
          if (orderAmount <= 10000) {
            commissionAmount = orderAmount * 0.05;
          } else {
            commissionAmount = (10000 * 0.05) + ((orderAmount - 10000) * 0.07);
          }
        }
      } else {
        // Regra padrão: 5%
        commissionRate = 5;
        commissionAmount = orderAmount * 0.05;
      }

      // Cria registro de comissão
      const { data: commission, error: commissionError } = await supabase
        .from('seller_commissions')
        .insert({
          org_id: currentOrg.id,
          seller_id: sellerId,
          order_id: orderId,
          commission_type: commissionType,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          base_amount: orderAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (commissionError) throw commissionError;

      return commission as Commission;
    } catch (error: any) {
      console.error('Error calculating commission:', error);
      return null;
    }
  };

  const approveCommission = async (
    commissionId: string,
    approverId: string
  ): Promise<boolean> => {
    if (!currentOrg) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('seller_commissions')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', commissionId)
        .eq('org_id', currentOrg.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comissão aprovada com sucesso",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar comissão",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const payCommission = async (
    commissionId: string,
    paymentReference: string
  ): Promise<boolean> => {
    if (!currentOrg) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('seller_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference,
        })
        .eq('id', commissionId)
        .eq('org_id', currentOrg.id)
        .eq('status', 'approved');

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comissão marcada como paga",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao pagar comissão",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelCommission = async (
    commissionId: string,
    reason: string
  ): Promise<boolean> => {
    if (!currentOrg) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('seller_commissions')
        .update({
          status: 'cancelled',
          notes: reason,
        })
        .eq('id', commissionId)
        .eq('org_id', currentOrg.id)
        .neq('status', 'paid');

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comissão cancelada",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar comissão",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSellerCommissions = async (
    sellerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Commission[]> => {
    if (!currentOrg) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('seller_commissions')
        .select(`
          *,
          orders (number)
        `)
        .eq('org_id', currentOrg.id)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as Commission[];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar comissões",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPendingCommissions = async (): Promise<Commission[]> => {
    if (!currentOrg) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_commissions')
        .select(`
          *,
          orders (number),
          profiles!seller_id (full_name)
        `)
        .eq('org_id', currentOrg.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Commission[];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar comissões",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    calculateCommission,
    approveCommission,
    payCommission,
    cancelCommission,
    getSellerCommissions,
    getPendingCommissions,
  };
};
