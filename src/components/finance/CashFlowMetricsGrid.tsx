import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CashFlowMetricsGridProps {
  metrics: any;
}

export function CashFlowMetricsGrid({ metrics }: CashFlowMetricsGridProps) {
  if (!metrics) {
    return null;
  }

  const getBurnRateColor = () => {
    if (metrics.burn_rate <= 0) return 'text-success';
    if (metrics.burn_rate < metrics.current_balance * 0.05) return 'text-warning';
    return 'text-destructive';
  };

  const getRunwayColor = () => {
    if (metrics.runway_days > 90) return 'text-success';
    if (metrics.runway_days > 30) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.current_balance)}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Projeção 30 dias</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.projected_30d)}</p>
              <div className="flex items-center gap-1 mt-1">
                {metrics.projected_30d > metrics.current_balance ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">
                      +{((metrics.projected_30d / metrics.current_balance - 1) * 100).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive">
                      {((metrics.projected_30d / metrics.current_balance - 1) * 100).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa de Queima</p>
              <p className={`text-2xl font-bold ${getBurnRateColor()}`}>
                {formatCurrency(Math.abs(metrics.burn_rate))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.burn_rate > 0 ? 'Negativo' : 'Positivo'} por dia
              </p>
            </div>
            <div className={`rounded-full p-2 ${
              metrics.burn_rate > 0 ? 'bg-destructive/10' : 'bg-success/10'
            }`}>
              <Activity className={`h-5 w-5 ${
                metrics.burn_rate > 0 ? 'text-destructive' : 'text-success'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Runway</p>
              <p className={`text-2xl font-bold ${getRunwayColor()}`}>
                {metrics.runway_days >= 999 ? '∞' : `${metrics.runway_days}d`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.runway_days >= 999 
                  ? 'Fluxo positivo'
                  : 'Até saldo zero'}
              </p>
            </div>
            <div className={`rounded-full p-2 ${
              metrics.runway_days > 90 ? 'bg-success/10' :
              metrics.runway_days > 30 ? 'bg-warning/10' :
              'bg-destructive/10'
            }`}>
              <AlertCircle className={`h-5 w-5 ${
                metrics.runway_days > 90 ? 'text-success' :
                metrics.runway_days > 30 ? 'text-warning' :
                'text-destructive'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entrada vs Saída Média</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-lg font-semibold text-success">
                      {formatCurrency(metrics.avg_daily_inflow)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                </div>
                <div className="text-2xl text-muted-foreground">vs</div>
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-lg font-semibold text-destructive">
                      {formatCurrency(metrics.avg_daily_outflow)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Saídas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Projeções Futuras (Cenário Realista)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-lg font-semibold">{formatCurrency(metrics.projected_30d)}</p>
                  <p className="text-xs text-muted-foreground">30 dias</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{formatCurrency(metrics.projected_60d)}</p>
                  <p className="text-xs text-muted-foreground">60 dias</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{formatCurrency(metrics.projected_90d)}</p>
                  <p className="text-xs text-muted-foreground">90 dias</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
