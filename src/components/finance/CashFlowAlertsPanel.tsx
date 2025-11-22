import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Activity,
  X,
  AlertCircle
} from 'lucide-react';
import { CashFlowAlert } from '@/hooks/useAdvancedCashFlow';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashFlowAlertsPanelProps {
  alerts: CashFlowAlert[];
  onDismiss: (alertId: string) => void;
}

export function CashFlowAlertsPanel({ alerts, onDismiss }: CashFlowAlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !a.dismissed);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'negative_balance': return <AlertTriangle className="h-5 w-5" />;
      case 'low_balance': return <DollarSign className="h-5 w-5" />;
      case 'high_outflow': return <TrendingDown className="h-5 w-5" />;
      case 'trend_decline': return <Activity className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (severity: string): 'default' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-destructive bg-destructive/10';
      case 'medium': return 'border-warning bg-warning/10';
      default: return 'border-muted bg-muted/50';
    }
  };

  if (activeAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-success" />
            Alertas de Fluxo de Caixa
          </CardTitle>
          <CardDescription>Monitoramento inteligente de projeções</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-success/10 p-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-medium mb-2">Tudo em ordem! 🎉</p>
            <p className="text-sm text-muted-foreground">
              Não há alertas críticos nas projeções de fluxo de caixa
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas de Fluxo de Caixa
            </CardTitle>
            <CardDescription>
              {activeAlerts.length} alerta(s) requer(em) atenção
            </CardDescription>
          </div>
          <Badge variant="destructive">{activeAlerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <Alert
              key={alert.id}
              className={`relative ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${
                  alert.severity === 'high' ? 'text-destructive' :
                  alert.severity === 'medium' ? 'text-warning' :
                  'text-muted-foreground'
                }`}>
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <Badge variant={getAlertVariant(alert.severity)} className="text-xs">
                      {alert.severity === 'high' ? 'CRÍTICO' :
                       alert.severity === 'medium' ? 'ATENÇÃO' :
                       'INFORMATIVO'}
                    </Badge>
                  </div>
                  
                  <AlertDescription className="text-sm mb-2">
                    {alert.description}
                  </AlertDescription>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {alert.date && (
                      <span>
                        Data: {format(new Date(alert.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                    {alert.amount && (
                      <span className="font-medium">
                        Valor: {formatCurrency(alert.amount)}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
