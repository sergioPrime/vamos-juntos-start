import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useSalesReports } from '@/hooks/useSalesReports';
import { format } from 'date-fns';

export default function SalesReports() {
  const {
    loading,
    getSalesByPeriod,
    getTopProducts,
    getSellerPerformance,
    getCustomerAnalysis,
    exportToExcel,
  } = useSalesReports();

  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(1)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState('sales');

  const handleGenerateReport = async () => {
    switch (reportType) {
      case 'sales':
        const salesData = await getSalesByPeriod(startDate, endDate);
        if (salesData.length > 0) {
          await exportToExcel(salesData, `vendas_${startDate}_${endDate}`);
        }
        break;
      case 'products':
        const productsData = await getTopProducts(50, startDate, endDate);
        if (productsData.length > 0) {
          await exportToExcel(productsData, `produtos_${startDate}_${endDate}`);
        }
        break;
      case 'sellers':
        const sellersData = await getSellerPerformance(undefined, startDate, endDate);
        if (sellersData.length > 0) {
          await exportToExcel(sellersData, `vendedores_${startDate}_${endDate}`);
        }
        break;
      case 'customers':
        const customersData = await getCustomerAnalysis();
        if (customersData.length > 0) {
          await exportToExcel(customersData, `clientes_${startDate}_${endDate}`);
        }
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Vendas</h1>
          <p className="text-muted-foreground">
            Análise completa de vendas, produtos e performance
          </p>
        </div>
        <Button onClick={handleGenerateReport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tipo de Relatório
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas por Período</SelectItem>
                  <SelectItem value="products">Produtos Mais Vendidos</SelectItem>
                  <SelectItem value="sellers">Performance de Vendedores</SelectItem>
                  <SelectItem value="customers">Análise de Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Vendas
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Período selecionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Total de pedidos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ticket Médio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Por pedido
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clientes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Com compras no período
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Gráfico de evolução de vendas será exibido aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Selecione um período e clique em "Gerar Relatório" para visualizar os dados
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Performance de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Selecione um período e clique em "Gerar Relatório" para visualizar os dados
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Análise de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Selecione um período e clique em "Gerar Relatório" para visualizar os dados
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
