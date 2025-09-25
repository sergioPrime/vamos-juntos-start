import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusinessNotifications } from '@/hooks/useBusinessNotifications'

interface Notification {
  id: string
  type: 'stock_low' | 'payment_due' | 'order_completed' | 'system_alert'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  read: boolean
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { runPeriodicChecks } = useBusinessNotifications()

  useEffect(() => {
    // Run periodic checks on mount
    runPeriodicChecks()
    
    // Set up interval for periodic checks
    const interval = setInterval(() => {
      runPeriodicChecks()
    }, 300000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [runPeriodicChecks])

  const getIcon = (type: string, priority: string) => {
    if (priority === 'critical' || type === 'stock_low') {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    }
    if (type === 'order_completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <Info className="h-4 w-4 text-blue-500" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      default: return 'secondary'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                        !notification.read ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => {
                        setNotifications(prev =>
                          prev.map(n =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        )
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(notification.type, notification.priority)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {notification.title}
                            </p>
                            <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                  }}
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}