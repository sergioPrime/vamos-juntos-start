import { Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useInventoryAlerts } from '@/hooks/useInventoryAlerts'
import { useNavigate } from 'react-router-dom'

export function AlertNotificationBell() {
  const { alerts, getUnresolvedAlertsCount, resolveAlert } = useInventoryAlerts()
  const navigate = useNavigate()
  
  const unreadCount = getUnresolvedAlertsCount()
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').slice(0, 5)
  const hasAlerts = unreadCount > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Package className="h-5 w-5" />
          {hasAlerts && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Alertas de Estoque</h3>
            <Badge variant="secondary">{unreadCount}</Badge>
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta no momento</p>
            </div>
          ) : (
            <div className="space-y-1">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  onClick={() => resolveAlert(alert.id)}
                >
                  <div className="flex items-start gap-2">
                    {alert.severity === 'critical' && (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{alert.title}</span>
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {alerts.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/inventory/alerts')}
            >
              Ver todos os alertas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}