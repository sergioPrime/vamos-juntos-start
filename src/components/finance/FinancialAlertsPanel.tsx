import { Bell, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFinancialAlerts } from '@/hooks/useFinancialAlerts'
import { Skeleton } from '@/components/ui/skeleton'

export function FinancialAlertsPanel() {
  const { alerts, loading, dismissAlert, getAlertsBySeverity } = useFinancialAlerts()

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const criticalCount = getAlertsBySeverity('critical').length
  const highCount = getAlertsBySeverity('high').length
  const mediumCount = getAlertsBySeverity('medium').length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Financeiros
          </CardTitle>
          <CardDescription>Monitoramento em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
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
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Financeiros
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Monitoramento em tempo real da saúde financeira</CardDescription>
          </div>
          {alerts.length > 0 && (
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive">{criticalCount} Crítico(s)</Badge>
              )}
              {highCount > 0 && (
                <Badge variant="default">{highCount} Alto(s)</Badge>
              )}
              {mediumCount > 0 && (
                <Badge variant="secondary">{mediumCount} Médio(s)</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum alerta ativo</h3>
            <p className="text-sm text-muted-foreground">
              Sua situação financeira está em ordem!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity === 'critical' ? 'Crítico' : 
                           alert.severity === 'high' ? 'Alto' :
                           alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                        {alert.action_label && (
                          <Button size="sm" variant="outline">
                            {alert.action_label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
