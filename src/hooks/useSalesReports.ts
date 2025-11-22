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
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('org_id', currentOrg.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'completed');

      if (error) throw error;

      // Group data
      const grouped: Record<string, SalesByPeriod> = {};
      data?.forEach((order) => {
        const date = order.created_at.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = {
            date,
            total_amount: 0,
            order_count: 0,
            avg_ticket: 0,
          };
        }
        grouped[date].total_amount += Number(order.total_amount);
        grouped[date].order_count += 1;
      });

      const result = Object.values(grouped).map(item => ({
        ...item,
        avg_ticket: item.total_amount / item.order_count,
      }));

      return result;
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
      // Simplified version - would need proper aggregation
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products (name),
          quantity,
          price
        `)
        .limit(limit);

      if (error) throw error;

      const result: TopProduct[] = [];
      return result;
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
      // Simplified version
      const result: SellerPerformance[] = [];
      return result;
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
      // Simplified version
      const result: CustomerAnalysis[] = [];
      return result;
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
