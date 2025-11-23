import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  severity: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

export function AdminNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AdminNotification[];
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Notificação marcada como lida');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      critical: { variant: 'destructive', label: 'Crítico' },
      warning: { variant: 'secondary', label: 'Aviso' },
      success: { variant: 'default', label: 'Sucesso' },
      info: { variant: 'outline', label: 'Info' },
    };

    const config = variants[severity] || variants.info;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notificações Administrativas</h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações foram lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsReadMutation.mutate()}>
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando notificações...</div>
          ) : notifications?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma notificação encontrada</div>
          ) : (
            notifications?.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{getSeverityIcon(notification.severity)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(notification.severity)}
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                          >
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
