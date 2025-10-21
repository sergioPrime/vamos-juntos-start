import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';
import { useRoleCheck } from './useRoleCheck';

interface AccessRequest {
  id: string;
  user_id: string;
  user_email?: string;
  module_key: string;
  permissions: {
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
  };
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  organization_id: string;
}

export function useAccessRequests() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { isAdmin } = useRoleCheck();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user || !currentOrg) return;

    setLoading(true);
    try {
      let query = supabase
        .from('access_requests')
        .select(`
          *,
          profiles!access_requests_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', currentOrg.id)
        .order('requested_at', { ascending: false });

      // Se não é admin, mostra apenas as próprias solicitações
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedRequests = (data || []).map((req: any) => ({
        ...req,
        user_email: req.profiles?.email || 'Email não disponível',
        user_name: req.profiles
          ? `${req.profiles.first_name || ''} ${req.profiles.last_name || ''}`.trim()
          : 'Nome não disponível',
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    // Subscription para real-time updates
    if (user && currentOrg) {
      const channel = supabase
        .channel('access_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'access_requests',
            filter: `organization_id=eq.${currentOrg.id}`,
          },
          () => {
            loadRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, currentOrg, isAdmin]);

  const createRequest = async (data: {
    module_key: string;
    permissions: {
      can_create: boolean;
      can_read: boolean;
      can_update: boolean;
      can_delete: boolean;
    };
    justification: string;
  }) => {
    if (!user || !currentOrg) throw new Error('Usuário ou organização não encontrados');

    const { error } = await supabase.from('access_requests').insert({
      user_id: user.id,
      organization_id: currentOrg.id,
      module_key: data.module_key,
      permissions: data.permissions as any,
      justification: data.justification,
      status: 'pending',
    });

    if (error) throw error;

    await loadRequests();
  };

  const approveRequest = async (requestId: string, notes?: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase.rpc('approve_access_request', {
      request_id: requestId,
      reviewer_id: user.id,
      notes: notes || null,
    });

    if (error) throw error;

    await loadRequests();
  };

  const rejectRequest = async (requestId: string, notes: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase.rpc('reject_access_request', {
      request_id: requestId,
      reviewer_id: user.id,
      notes: notes,
    });

    if (error) throw error;

    await loadRequests();
  };

  return {
    requests,
    loading,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: loadRequests,
  };
}
