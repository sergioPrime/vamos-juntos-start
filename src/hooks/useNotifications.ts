import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: any;
  user_id: string;
  org_id: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();

  // Fetch user notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id, currentOrg?.id],
    queryFn: async () => {
      if (!user?.id || !currentOrg?.id) return [];

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id && !!currentOrg?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Get urgent notifications
  const urgentNotifications = notifications.filter(n => 
    n.priority === 'urgent' && !n.is_read
  );

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao marcar notificação',
        description: error.message,
      });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentOrg?.id) return;

      const { error } = await supabase
        .from('user_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('org_id', currentOrg.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Todas as notificações foram marcadas como lidas',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao marcar notificações',
        description: error.message,
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificação excluída',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir notificação',
        description: error.message,
      });
    },
  });

  // Create notification (for testing)
  const createNotificationMutation = useMutation({
    mutationFn: async (notification: Partial<Notification>) => {
      if (!user?.id || !currentOrg?.id) return;

      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: user.id,
          org_id: currentOrg.id,
          title: notification.title || 'Nova Notificação',
          message: notification.message || 'Teste de notificação',
          type: notification.type || 'info',
          priority: notification.priority || 'medium',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificação criada',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar notificação',
        description: error.message,
      });
    },
  });

  return {
    notifications,
    unreadCount,
    urgentNotifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    createNotification: createNotificationMutation.mutate,
  };
}
