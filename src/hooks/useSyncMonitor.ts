import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface SyncLog {
  id: string;
  org_id: string;
  sync_type: string;
  source_table: string;
  source_id: string;
  target_table?: string;
  target_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface SyncStatistics {
  sync_type: string;
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  success_rate: number;
}

export function useSyncMonitor() {
  const { currentOrg } = useOrganization();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [statistics, setStatistics] = useState<SyncStatistics[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async (limit: number = 50) => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error: any) {
      console.error('Error loading sync logs:', error);
      toast.error('Erro ao carregar logs de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (days: number = 7) => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_sync_statistics', {
        p_org_id: currentOrg.id,
        p_days: days
      });

      if (error) throw error;
      setStatistics(data || []);
    } catch (error: any) {
      console.error('Error loading sync statistics:', error);
      toast.error('Erro ao carregar estatísticas de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const getLogsByType = (syncType: string) => {
    return logs.filter(log => log.sync_type === syncType);
  };

  const getFailedLogs = () => {
    return logs.filter(log => log.status === 'failed');
  };

  const getRecentLogs = (hours: number = 24) => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return logs.filter(log => 
      new Date(log.created_at) > cutoffTime
    );
  };

  const getSyncTypeLabel = (syncType: string): string => {
    const labels: Record<string, string> = {
      'order_to_stock': 'Pedido → Estoque',
      'order_to_financial': 'Pedido → Financeiro',
      'purchase_to_stock': 'Compra → Estoque',
      'installment_to_transaction': 'Parcela → Transação Bancária',
      'invoice_to_financial': 'Fatura → Financeiro',
      'stock_adjustment': 'Ajuste de Estoque'
    };
    
    return labels[syncType] || syncType;
  };

  useEffect(() => {
    if (currentOrg?.id) {
      loadLogs();
      loadStatistics();
    }
  }, [currentOrg?.id]);

  return {
    logs,
    statistics,
    loading,
    loadLogs,
    loadStatistics,
    getLogsByType,
    getFailedLogs,
    getRecentLogs,
    getSyncTypeLabel
  };
}
