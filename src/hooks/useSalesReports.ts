import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

export interface SalesByPeriod {
  date: string;
  total_amount: number;
  order_count: number;
  avg_ticket: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  total_amount: number;
  profit_margin: number;
}

export interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  order_count: number;
  total_amount: number;
  commission: number;
  goal_achievement: number;
}

export interface CustomerAnalysis {
  customer_id: string;
  customer_name: string;
  total_purchases: number;
  total_amount: number;
  avg_ticket: number;
  last_purchase: string;
  frequency_days: number;
}

export const useSalesReports = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const getSalesByPeriod = async (
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<SalesByPeriod[]> => {
    if (!currentOrg) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return [];
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_sales_by_period', {
        p_org_id: currentOrg.id,
        p_start_date: startDate,
        p_end_date: endDate,
        p_group_by: groupBy,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar vendas",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTopProducts = async (
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopProduct[]> => {
    if (!currentOrg) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_top_products', {
        p_org_id: currentOrg.id,
        p_limit: limit,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSellerPerformance = async (
    sellerId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<SellerPerformance[]> => {
    if (!currentOrg) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_seller_performance', {
        p_org_id: currentOrg.id,
        p_seller_id: sellerId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar performance",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCustomerAnalysis = async (
    customerId?: string,
    minPurchases: number = 1
  ): Promise<CustomerAnalysis[]> => {
    if (!currentOrg) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_customer_analysis', {
        p_org_id: currentOrg.id,
        p_customer_id: customerId,
        p_min_purchases: minPurchases,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar análise",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (data: any[], filename: string) => {
    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    loading,
    getSalesByPeriod,
    getTopProducts,
    getSellerPerformance,
    getCustomerAnalysis,
    exportToExcel,
  };
};
