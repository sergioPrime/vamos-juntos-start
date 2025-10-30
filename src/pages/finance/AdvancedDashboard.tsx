import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialMetricsGrid } from '@/components/finance/FinancialMetricsGrid';
import { CashFlowChart } from '@/components/finance/CashFlowChart';
import { CategoryBreakdownChart } from '@/components/finance/CategoryBreakdownChart';
import { AgingAnalysisPanel } from '@/components/finance/AgingAnalysisPanel';
import { OverdueInstallmentsPanel } from '@/components/finance/OverdueInstallmentsPanel';
import { SyncMonitorPanel } from '@/components/integration/SyncMonitorPanel';
import { ExportDialog } from '@/components/finance/ExportDialog';
import { 
  Download, 
  RefreshCw, 
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Loader2,
  PieChart,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdvancedDashboard() {
  const { currentOrg } = useOrganization();
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const { 
    metrics, 
    cashFlowData, 
    revenueByCategory, 
    expensesByCategory,
    loading,
    refreshMetrics 
  } = useFinancialMetrics(startDate, endDate);

  const getAlertCount = () => {
    let count = 0;
    if (metrics.overdueReceivables > 0) count++;
    if (metrics.overduePayables > 0) count++;
    if (metrics.netProfit < 0) count++;
    return count;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Status Indicators */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
              {getAlertCount() > 0 && (
                <Badge variant="destructive" className="h-6">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {getAlertCount()} alertas
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Análise completa e insights estratégicos do seu negócio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={refreshMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Enhanced Date Filters with Quick Presets */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Período de Análise
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setStartDate(firstDayMonth.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                >
                  Este Mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    setStartDate(firstDayLastMonth.toISOString().split('T')[0]);
                    setEndDate(lastDayLastMonth.toISOString().split('T')[0]);
                  }}
                >
                  Mês Anterior
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <Label htmlFor="start-date" className="text-sm font-medium">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex-1 w-full">
                <Label htmlFor="end-date" className="text-sm font-medium">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button onClick={refreshMetrics} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Fluxo de Caixa</span>
                <span className="sm:hidden">Fluxo</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <PieChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Cat.</span>
              </TabsTrigger>
              <TabsTrigger value="aging" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Aging</span>
                <span className="sm:hidden">Aging</span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vencidos</span>
                <span className="sm:hidden">Venc.</span>
              </TabsTrigger>
              <TabsTrigger value="sync" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sincronização</span>
                <span className="sm:hidden">Sync</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <FinancialMetricsGrid metrics={metrics} />
              <CashFlowChart data={cashFlowData} />
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-6">
              <CashFlowChart 
                data={cashFlowData}
                title="Análise Detalhada de Fluxo de Caixa"
                description="Acompanhe entradas e saídas diárias do seu negócio"
              />
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryBreakdownChart
                  data={revenueByCategory}
                  title="Receitas por Categoria"
                  description="Distribuição das suas principais fontes de receita"
                />
                <CategoryBreakdownChart
                  data={expensesByCategory}
                  title="Despesas por Categoria"
                  description="Onde seu dinheiro está sendo gasto"
                />
              </div>
            </TabsContent>

            <TabsContent value="aging" className="space-y-6">
              <AgingAnalysisPanel />
            </TabsContent>

            <TabsContent value="overdue" className="space-y-6">
              <OverdueInstallmentsPanel />
            </TabsContent>

            <TabsContent value="sync" className="space-y-6">
              <SyncMonitorPanel />
            </TabsContent>
          </Tabs>
        )}

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          data={{
            metrics,
            cashFlowData,
            revenueByCategory,
            expensesByCategory
          }}
          organizationName={currentOrg?.name}
          period={{
            start: startDate,
            end: endDate
          }}
        />
      </div>
    </AppLayout>
  );
}
