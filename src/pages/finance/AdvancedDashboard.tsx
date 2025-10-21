import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { FinancialMetricsGrid } from '@/components/finance/FinancialMetricsGrid';
import { CashFlowChart } from '@/components/finance/CashFlowChart';
import { CategoryBreakdownChart } from '@/components/finance/CategoryBreakdownChart';
import { AgingAnalysisPanel } from '@/components/finance/AgingAnalysisPanel';
import { OverdueInstallmentsPanel } from '@/components/finance/OverdueInstallmentsPanel';
import { SyncMonitorPanel } from '@/components/integration/SyncMonitorPanel';
import { 
  Download, 
  RefreshCw, 
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';

export default function AdvancedDashboard() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { 
    metrics, 
    cashFlowData, 
    revenueByCategory, 
    expensesByCategory,
    loading,
    refreshMetrics 
  } = useFinancialMetrics(startDate, endDate);

  const handleExport = () => {
    // Implementar exportação de dados
    console.log('Exporting data...');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">
              Análise completa e insights do seu negócio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={refreshMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros de Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={refreshMetrics}>
                Aplicar
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
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="cashflow">
                <TrendingUp className="h-4 w-4 mr-2" />
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Activity className="h-4 w-4 mr-2" />
                Por Categoria
              </TabsTrigger>
              <TabsTrigger value="aging">
                <Calendar className="h-4 w-4 mr-2" />
                Aging
              </TabsTrigger>
              <TabsTrigger value="overdue">
                <Calendar className="h-4 w-4 mr-2" />
                Vencidos
              </TabsTrigger>
              <TabsTrigger value="sync">
                <Activity className="h-4 w-4 mr-2" />
                Sincronização
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
      </div>
    </AppLayout>
  );
}
