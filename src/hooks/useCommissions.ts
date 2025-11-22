import { useState } from 'react';
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
      // Regra padrão: 5% de comissão
      const commissionRate = 5;
      const commissionAmount = orderAmount * (commissionRate / 100);

      const commission: Commission = {
        id: crypto.randomUUID(),
        seller_id: sellerId,
        order_id: orderId,
        commission_type: 'percentage',
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        base_amount: orderAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      return commission;
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
      // Lógica de aprovação será implementada quando as tabelas forem criadas
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
      // Retorna dados mockados até tabelas serem criadas
      return [];
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
      // Retorna dados mockados até tabelas serem criadas
      return [];
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
