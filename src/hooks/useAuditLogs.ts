import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface AuditLog {
  id: string;
  org_id: string;
  transaction_type: string;
  table_name: string;
  record_id: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  user_id: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UseAuditLogsParams {
  transactionType?: string;
  actionType?: string;
  tableName?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAuditLogs(params?: UseAuditLogsParams) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrganization();

  const loadLogs = async () => {
    if (!currentOrg) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('transaction_audit')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (params?.transactionType) {
        query = query.eq('transaction_type', params.transactionType);
      }

      if (params?.actionType) {
        query = query.eq('action_type', params.actionType);
      }

      if (params?.tableName) {
        query = query.eq('table_name', params.tableName);
      }

      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params?.startDate) {
        query = query.gte('created_at', params.startDate.toISOString());
      }

      if (params?.endDate) {
        query = query.lte('created_at', params.endDate.toISOString());
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      } else {
        query = query.limit(100); // Limite padrão
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Buscar informações dos usuários
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', log.user_id)
            .single();
          
          return {
            ...log,
            profiles: profile || undefined
          } as AuditLog;
        })
      );
      
      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [
    currentOrg,
    params?.transactionType,
    params?.actionType,
    params?.tableName,
    params?.userId,
    params?.startDate,
    params?.endDate,
    params?.limit
  ]);

  return {
    logs,
    loading,
    refresh: loadLogs
  };
}
