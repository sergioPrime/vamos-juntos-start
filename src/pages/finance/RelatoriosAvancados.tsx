import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { AgingAnalysisChart } from '@/components/finance/AgingAnalysisChart';
import { TopCustomersTable } from '@/components/finance/TopCustomersTable';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function RelatoriosAvancados() {
  const {
    loading,
    getAgingAnalysis,
    getFinancialSummary,
    getTopCustomers,
    getCategoryBreakdown
  } = useFinancialReports();

  const [agingData, setAgingData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const loadAllReports = async () => {
    const [aging, summary, customers, categories] = await Promise.all([
      getAgingAnalysis(endDate),
      getFinancialSummary(startDate, endDate),
      getTopCustomers(startDate, endDate, 10),
      getCategoryBreakdown(startDate, endDate, 'payable')
    ]);

    setAgingData(aging);
    setSummaryData(summary);
    setTopCustomers(customers);
    setCategoryBreakdown(categories);
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const handleRefresh = () => {
    loadAllReports();
    toast.success('Relatórios atualizados');
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exportando para ${format.toUpperCase()}...`);
    // Implementar exportação real aqui
  };

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Análises Avançadas</h1>
          <p className="text-muted-foreground mt-1">
            Visão analítica completa do desempenho financeiro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadAllReports} disabled={loading} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      {summaryData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(summaryData.revenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valores realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summaryData.expenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valores realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summaryData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(summaryData.profit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margem: {summaryData.profit_margin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summaryData.cash_flow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(summaryData.cash_flow)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Projetado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Análises */}
      <Tabs defaultValue="aging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aging">
            <FileText className="h-4 w-4 mr-2" />
            Análise Aging
          </TabsTrigger>
          <TabsTrigger value="customers">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Clientes
          </TabsTrigger>
          <TabsTrigger value="categories">
            <DollarSign className="h-4 w-4 mr-2" />
            Por Categoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aging">
          {agingData ? (
            <AgingAnalysisChart data={agingData} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Carregando análise aging...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers">
          <TopCustomersTable customers={topCustomers} loading={loading} />
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma despesa encontrada no período</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category.category_name}</p>
                          <p className="text-sm text-muted-foreground">{category.category_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(category.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.transaction_count} transação(ões)
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {category.percentage.toFixed(1)}% do total
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
