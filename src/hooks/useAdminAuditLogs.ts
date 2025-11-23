import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminAuditLog {
  id: string;
  org_id: string | null;
  user_id: string;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAdminAuditLogsParams {
  actionType?: string;
  entityType?: string;
  userId?: string;
  orgId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  search?: string;
}

export function useAdminAuditLogs(params?: UseAdminAuditLogsParams) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const loadLogs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (params?.actionType) {
        query = query.eq('action_type', params.actionType);
      }

      if (params?.entityType) {
        query = query.eq('entity_type', params.entityType);
      }

      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params?.orgId) {
        query = query.eq('org_id', params.orgId);
      }

      if (params?.startDate) {
        query = query.gte('created_at', params.startDate.toISOString());
      }

      if (params?.endDate) {
        query = query.lte('created_at', params.endDate.toISOString());
      }

      if (params?.search) {
        query = query.or(`user_email.ilike.%${params.search}%,entity_id.ilike.%${params.search}%`);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading admin audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Data/Hora',
      'Usuário',
      'Ação',
      'Entidade',
      'ID da Entidade',
      'IP',
      'User Agent'
    ];

    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.user_email || 'N/A',
      log.action_type,
      log.entity_type,
      log.entity_id || 'N/A',
      log.ip_address || 'N/A',
      log.user_agent || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadLogs();
  }, [
    user,
    params?.actionType,
    params?.entityType,
    params?.userId,
    params?.orgId,
    params?.startDate,
    params?.endDate,
    params?.limit,
    params?.search
  ]);

  return {
    logs,
    loading,
    totalCount,
    refresh: loadLogs,
    exportToCSV
  };
}
