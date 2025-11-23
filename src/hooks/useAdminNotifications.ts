import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  action_url: string | null;
  metadata: any;
  org_id: string | null;
}

export function useAdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useSuperAdmin();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      if (!isSuperAdmin) return [];

      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AdminNotification[];
    },
    enabled: isSuperAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
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
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
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
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
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

  // Create test notification (for development)
  const createTestNotificationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          title: 'Notificação de Teste',
          message: 'Esta é uma notificação de teste do sistema administrativo.',
          notification_type: 'system',
          severity: 'info',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({
        title: 'Notificação de teste criada',
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
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    createTestNotification: createTestNotificationMutation.mutate,
  };
}
