import { useBlockchainAlerts } from '@/hooks/useBlockchainAlerts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, CheckCircle2, Clock, Mail, MailCheck, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function BlockchainAlertsPanel() {
  const { 
    alerts, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAsResolved, 
    markAllAsRead 
  } = useBlockchainAlerts()

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-500 border-red-500/20'
    }
    return colors[severity] || colors.high
  }

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    }
    return labels[severity] || severity
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return '🔥'
    if (severity === 'high') return '🚨'
    if (severity === 'medium') return '⚠️'
    return 'ℹ️'
  }

  const activeAlerts = alerts.filter(a => !a.is_resolved)
  const resolvedAlerts = alerts.filter(a => a.is_resolved)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Segurança
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} novos
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Notificações de inconsistências na blockchain
            </CardDescription>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Marcar todos como lidos
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum alerta de segurança detectado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sua blockchain está íntegra e segura
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                  Alertas Ativos ({activeAlerts.length})
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          !alert.is_read ? 'bg-muted/50 border-primary/20' : 'bg-background'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {getSeverityIcon(alert.severity)}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={getSeverityColor(alert.severity)}
                              >
                                {getSeverityLabel(alert.severity)}
                              </Badge>
                              {alert.block_number && (
                                <Badge variant="outline" className="font-mono">
                                  Bloco #{alert.block_number}
                                </Badge>
                              )}
                              {!alert.is_read && (
                                <Badge variant="default" className="bg-primary/20">
                                  Novo
                                </Badge>
                              )}
                            </div>
                            
                            <p className="font-medium mb-2">{alert.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                              
                              {alert.email_sent && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <MailCheck className="h-3 w-3" />
                                  Email enviado
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {!alert.is_read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(alert.id)}
                              >
                                Marcar como lido
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => markAsResolved(alert.id)}
                            >
                              Resolver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Resolved Alerts */}
            {resolvedAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                  Alertas Resolvidos ({resolvedAlerts.length})
                </h3>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {resolvedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Resolvido
                          </Badge>
                          {alert.block_number && (
                            <Badge variant="outline" className="font-mono">
                              Bloco #{alert.block_number}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm mb-2">{alert.message}</p>
                        
                        <div className="text-xs text-muted-foreground">
                          Resolvido em {format(new Date(alert.resolved_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
