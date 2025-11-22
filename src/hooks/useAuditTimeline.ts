import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface AuditTimelineEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  user_email: string;
  event_timestamp: string;
  ip_address: string | null;
  metadata: Record<string, any>;
}

interface UseAuditTimelineParams {
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAuditTimeline(params: UseAuditTimelineParams = {}) {
  const { currentOrg } = useOrganization();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['audit-timeline', currentOrg?.id, params],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase.rpc('get_audit_timeline', {
        p_org_id: currentOrg.id,
        p_entity_type: params.entityType || null,
        p_entity_id: params.entityId || null,
        p_user_id: params.userId || null,
        p_start_date: params.startDate?.toISOString() || null,
        p_end_date: params.endDate?.toISOString() || null,
        p_limit: params.limit || 100,
      });

      if (error) throw error;
      return (data || []) as unknown as AuditTimelineEvent[];
    },
    enabled: !!currentOrg?.id,
  });

  // Agrupar eventos por data
  const eventsByDate = events.reduce((acc, event) => {
    const date = new Date(event.event_timestamp).toLocaleDateString('pt-BR');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, AuditTimelineEvent[]>);

  return {
    events,
    eventsByDate,
    isLoading,
    error,
  };
}
