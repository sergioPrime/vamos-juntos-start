import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvancedCashFlow } from '@/hooks/useAdvancedCashFlow';
import { AdvancedCashFlowChart } from '@/components/finance/AdvancedCashFlowChart';
import { CashFlowAlertsPanel } from '@/components/finance/CashFlowAlertsPanel';
import { CashFlowMetricsGrid } from '@/components/finance/CashFlowMetricsGrid';
import { RefreshCw, TrendingUp, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function CashFlowDashboard() {
  const [daysAhead, setDaysAhead] = useState(90);
  const {
    loading,
    scenarios,
    alerts,
    metrics,
    generateAdvancedProjections,
    dismissAlert,
    getActiveAlerts
  } = useAdvancedCashFlow(daysAhead);

  const handleRefresh = () => {
    generateAdvancedProjections();
    toast.success('Projeções atualizadas');
  };

  const handleExport = () => {
    // Preparar dados para exportação
    const csvContent = [
      ['Data', 'Cenário Otimista', 'Cenário Realista', 'Cenário Pessimista', 'Entradas Confirmadas', 'Saídas Confirmadas'],
      ...scenarios.map(s => [
        s.date,
        s.optimistic.toString(),
        s.realistic.toString(),
        s.pessimistic.toString(),
        s.confirmed_inflow.toString(),
        s.confirmed_outflow.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `projecao_fluxo_caixa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Relatório exportado com sucesso');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Fluxo de Caixa Avançado
          </h1>
          <p className="text-muted-foreground mt-1">
            Projeções inteligentes com múltiplos cenários e alertas proativos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={daysAhead.toString()} onValueChange={(v) => setDaysAhead(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} disabled={loading || scenarios.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <>
          <CashFlowAlertsPanel
            alerts={alerts}
            onDismiss={dismissAlert}
          />

          <CashFlowMetricsGrid metrics={metrics} />

          <AdvancedCashFlowChart
            scenarios={scenarios}
            metrics={metrics}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full bg-success/10 p-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cenário Otimista</h3>
                    <p className="text-xs text-muted-foreground">+20% entradas, -20% saídas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">30 dias:</span>
                    <span className="font-semibold text-success">
                      {formatCurrency(scenarios[29]?.optimistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">60 dias:</span>
                    <span className="font-semibold text-success">
                      {formatCurrency(scenarios[59]?.optimistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">90 dias:</span>
                    <span className="font-semibold text-success">
                      {formatCurrency(scenarios[89]?.optimistic || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cenário Realista</h3>
                    <p className="text-xs text-muted-foreground">Baseado em médias históricas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">30 dias:</span>
                    <span className="font-semibold">
                      {formatCurrency(scenarios[29]?.realistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">60 dias:</span>
                    <span className="font-semibold">
                      {formatCurrency(scenarios[59]?.realistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">90 dias:</span>
                    <span className="font-semibold">
                      {formatCurrency(scenarios[89]?.realistic || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full bg-destructive/10 p-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cenário Pessimista</h3>
                    <p className="text-xs text-muted-foreground">-30% entradas, +20% saídas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">30 dias:</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(scenarios[29]?.pessimistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">60 dias:</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(scenarios[59]?.pessimistic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">90 dias:</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(scenarios[89]?.pessimistic || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
