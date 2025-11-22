import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface FiscalMetrics {
  totalNFes: number;
  totalFaturamento: number;
  totalTributos: number;
  nfesCanceladas: number;
  mediaTicket: number;
  icmsTotal: number;
  issTotal: number;
  pisTotal: number;
  cofinsTotal: number;
  ipiTotal: number;
}

interface MonthlyRevenue {
  month: string;
  faturamento: number;
  tributos: number;
  nfes: number;
}

interface TaxBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export function useFiscalMetrics(startDate?: Date, endDate?: Date) {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<FiscalMetrics>({
    totalNFes: 0,
    totalFaturamento: 0,
    totalTributos: 0,
    nfesCanceladas: 0,
    mediaTicket: 0,
    icmsTotal: 0,
    issTotal: 0,
    pisTotal: 0,
    cofinsTotal: 0,
    ipiTotal: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadMetrics();
    }
  }, [organization?.id, startDate, endDate]);

  const loadMetrics = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const start = startDate || startOfMonth(subMonths(new Date(), 5));
      const end = endDate || endOfMonth(new Date());

      // Buscar NFes do período
      let query = supabase
        .from('nfe')
        .select('*')
        .eq('org_id', organization.id)
        .gte('data_emissao', format(start, 'yyyy-MM-dd'))
        .lte('data_emissao', format(end, 'yyyy-MM-dd'));

      const { data: nfes, error } = await query;

      if (error) throw error;

      // Calcular métricas
      const totalNFes = nfes?.length || 0;
      const nfesCanceladas = nfes?.filter(n => n.status === 'cancelada').length || 0;
      
      const totalFaturamento = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_total) || 0) : sum, 0
      ) || 0;

      const icmsTotal = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_icms) || 0) : sum, 0
      ) || 0;

      const issTotal = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_is) || 0) : sum, 0
      ) || 0;

      const pisTotal = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_pis) || 0) : sum, 0
      ) || 0;

      const cofinsTotal = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_cofins) || 0) : sum, 0
      ) || 0;

      const ipiTotal = nfes?.reduce((sum, nfe) => 
        nfe.status !== 'cancelada' ? sum + (Number(nfe.valor_ipi) || 0) : sum, 0
      ) || 0;

      const totalTributos = icmsTotal + issTotal + pisTotal + cofinsTotal + ipiTotal;

      const nfesAtivas = nfes?.filter(n => n.status !== 'cancelada').length || 0;
      const mediaTicket = nfesAtivas > 0 ? totalFaturamento / nfesAtivas : 0;

      setMetrics({
        totalNFes,
        totalFaturamento,
        totalTributos,
        nfesCanceladas,
        mediaTicket,
        icmsTotal,
        issTotal,
        pisTotal,
        cofinsTotal,
        ipiTotal,
      });

      // Preparar dados mensais
      const monthlyMap = new Map<string, MonthlyRevenue>();
      
      nfes?.forEach(nfe => {
        if (nfe.status === 'cancelada') return;
        
        const month = format(new Date(nfe.data_emissao), 'MMM/yy');
        const existing = monthlyMap.get(month) || { month, faturamento: 0, tributos: 0, nfes: 0 };
        
        existing.faturamento += Number(nfe.valor_total) || 0;
        existing.tributos += (Number(nfe.valor_icms) || 0) + (Number(nfe.valor_is) || 0) + 
                            (Number(nfe.valor_pis) || 0) + (Number(nfe.valor_cofins) || 0) + 
                            (Number(nfe.valor_ipi) || 0);
        existing.nfes += 1;
        
        monthlyMap.set(month, existing);
      });

      setMonthlyData(Array.from(monthlyMap.values()));

      // Preparar breakdown de tributos
      const breakdown: TaxBreakdown[] = [
        { name: 'ICMS', value: icmsTotal, percentage: totalTributos > 0 ? (icmsTotal / totalTributos) * 100 : 0 },
        { name: 'ISS', value: issTotal, percentage: totalTributos > 0 ? (issTotal / totalTributos) * 100 : 0 },
        { name: 'PIS', value: pisTotal, percentage: totalTributos > 0 ? (pisTotal / totalTributos) * 100 : 0 },
        { name: 'COFINS', value: cofinsTotal, percentage: totalTributos > 0 ? (cofinsTotal / totalTributos) * 100 : 0 },
        { name: 'IPI', value: ipiTotal, percentage: totalTributos > 0 ? (ipiTotal / totalTributos) * 100 : 0 },
      ].filter(t => t.value > 0);

      setTaxBreakdown(breakdown);

    } catch (error) {
      console.error('Error loading fiscal metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    monthlyData,
    taxBreakdown,
    loading,
    refreshMetrics: loadMetrics,
  };
}
