import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AdminNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast.success('Notificação marcada como lida')
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast.success('Todas as notificações marcadas como lidas')
    },
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-destructive/50 bg-destructive/5'
      case 'high':
        return 'border-orange-500/50 bg-orange-500/5'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/5'
      default:
        return 'border-blue-500/50 bg-blue-500/5'
    }
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Notificações do Sistema</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${getSeverityColor(notification.severity)} ${!notification.is_read ? 'border-2' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">Novo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Marcar como lida
                            </Button>
                          )}
                          {notification.action_url && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.location.href = notification.action_url!}
                            >
                              Ver detalhes
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação no momento</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
