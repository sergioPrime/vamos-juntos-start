import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, AlertTriangle, Calendar, FileText, Download, Filter, Target, Percent, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FinancialKPIData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  outstandingReceivables: number
  overdueReceivables: number
  totalPayables: number
  overduePayables: number
  cashFlow: number
  avgCollectionTime: number
  avgPaymentTime: number
  liquidityRatio: number
}

interface CashFlowData {
  month: string
  inflows: number
  outflows: number
  netFlow: number
  accumulated: number
}

interface RevenueByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpenseByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface CustomerAnalysis {
  customer: string
  totalRevenue: number
  avgTicket: number
  invoices: number
  daysToPay: number
  status: string
}

interface SupplierAnalysis {
  supplier: string
  totalExpense: number
  invoices: number
  avgAmount: number
  daysToPay: number
  rating: number
}

interface MonthlyComparison {
  metric: string
  currentMonth: number
  previousMonth: number
  variation: number
  trend: 'up' | 'down' | 'stable'
}

const FinancialReports = () => {
  const { currentOrg: currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Mock data for demonstration
  const [kpiData] = useState<FinancialKPIData>({
    totalRevenue: 285430.50,
    totalExpenses: 198750.25,
    netProfit: 86680.25,
    profitMargin: 30.4,
    outstandingReceivables: 45280.00,
    overdueReceivables: 12450.00,
    totalPayables: 32180.00,
    overduePayables: 8920.00,
    cashFlow: 54500.25,
    avgCollectionTime: 28.5,
    avgPaymentTime: 22.3,
    liquidityRatio: 2.8
  })

  const [cashFlowData] = useState<CashFlowData[]>([
    { month: 'Jan', inflows: 45200, outflows: 32100, netFlow: 13100, accumulated: 13100 },
    { month: 'Fev', inflows: 52800, outflows: 35600, netFlow: 17200, accumulated: 30300 },
    { month: 'Mar', inflows: 48600, outflows: 38200, netFlow: 10400, accumulated: 40700 },
    { month: 'Abr', inflows: 56200, outflows: 41800, netFlow: 14400, accumulated: 55100 },
    { month: 'Mai', inflows: 58900, outflows: 39500, netFlow: 19400, accumulated: 74500 },
    { month: 'Jun', inflows: 62100, outflows: 42300, netFlow: 19800, accumulated: 94300 }
  ])

  const [revenueByCategory] = useState<RevenueByCategory[]>([
    { category: 'Produtos', amount: 165420.50, percentage: 58.0, color: '#3B82F6' },
    { category: 'Serviços', amount: 85650.00, percentage: 30.0, color: '#10B981' },
    { category: 'Consultoria', amount: 28560.00, percentage: 10.0, color: '#F59E0B' },
    { category: 'Outros', amount: 5800.00, percentage: 2.0, color: '#8B5CF6' }
  ])

  const [expenseByCategory] = useState<ExpenseByCategory[]>([
    { category: 'Pessoal', amount: 89250.00, percentage: 44.9, color: '#EF4444' },
    { category: 'Fornecedores', amount: 56780.25, percentage: 28.6, color: '#F97316' },
    { category: 'Operacional', amount: 28650.00, percentage: 14.4, color: '#8B5CF6' },
    { category: 'Marketing', amount: 15420.00, percentage: 7.8, color: '#06B6D4' },
    { category: 'TI/Tecnologia', amount: 8650.00, percentage: 4.3, color: '#84CC16' }
  ])

  const [customerAnalysis] = useState<CustomerAnalysis[]>([
    { customer: 'Empresa Alpha Ltda', totalRevenue: 45680.00, avgTicket: 2284.00, invoices: 20, daysToPay: 25, status: 'Excelente' },
    { customer: 'Beta Corp S.A.', totalRevenue: 38920.00, avgTicket: 3240.83, invoices: 12, daysToPay: 18, status: 'Bom' },
    { customer: 'Gamma Tech', totalRevenue: 32150.00, avgTicket: 2010.94, invoices: 16, daysToPay: 35, status: 'Regular' },
    { customer: 'Delta Solutions', totalRevenue: 28500.00, avgTicket: 4750.00, invoices: 6, daysToPay: 15, status: 'Excelente' },
    { customer: 'Epsilon Group', totalRevenue: 22480.00, avgTicket: 1873.33, invoices: 12, daysToPay: 42, status: 'Atenção' }
  ])

  const [supplierAnalysis] = useState<SupplierAnalysis[]>([
    { supplier: 'Fornecedor Prime', totalExpense: 28650.00, invoices: 15, avgAmount: 1910.00, daysToPay: 30, rating: 4.8 },
    { supplier: 'Tech Supply Co.', totalExpense: 24320.00, invoices: 8, avgAmount: 3040.00, daysToPay: 45, rating: 4.5 },
    { supplier: 'Office Solutions', totalExpense: 18750.00, invoices: 12, avgAmount: 1562.50, daysToPay: 15, rating: 4.7 },
    { supplier: 'Global Services', totalExpense: 15680.00, invoices: 6, avgAmount: 2613.33, daysToPay: 60, rating: 4.2 },
    { supplier: 'Local Partner', totalExpense: 12850.00, invoices: 9, avgAmount: 1427.78, daysToPay: 20, rating: 4.6 }
  ])

  const [monthlyComparison] = useState<MonthlyComparison[]>([
    { metric: 'Receita Total', currentMonth: 62100, previousMonth: 58900, variation: 5.4, trend: 'up' },
    { metric: 'Despesas Totais', currentMonth: 42300, previousMonth: 39500, variation: 7.1, trend: 'up' },
    { metric: 'Lucro Líquido', currentMonth: 19800, previousMonth: 19400, variation: 2.1, trend: 'up' },
    { metric: 'Margem de Lucro (%)', currentMonth: 31.9, previousMonth: 32.9, variation: -3.0, trend: 'down' },
    { metric: 'Contas a Receber', currentMonth: 45280, previousMonth: 42150, variation: 7.4, trend: 'up' },
    { metric: 'Contas a Pagar', currentMonth: 32180, previousMonth: 35600, variation: -9.6, trend: 'down' }
  ])

  useEffect(() => {
    if (currentOrganization) {
      // Set default date range (last 6 months)
      const today = new Date()
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
      
      setDateFrom(sixMonthsAgo.toISOString().split('T')[0])
      setDateTo(today.toISOString().split('T')[0])
      
      setLoading(false)
    }
  }, [currentOrganization])

  const exportReport = (reportType: string) => {
    toast({
      title: "Exportação iniciada",
      description: `Relatório de ${reportType} sendo preparado para download`,
    })
  }

  const applyFilters = () => {
    toast({
      title: "Filtros aplicados",
      description: "Dados atualizados conforme filtros selecionados",
    })
  }

  const getCustomerStatusColor = (status: string) => {
    const colors = {
      'Excelente': 'bg-green-600',
      'Bom': 'bg-blue-600',
      'Regular': 'bg-yellow-600',
      'Atenção': 'bg-red-600'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-600'
  }

  const getSupplierRating = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-600">Excelente</Badge>
    if (rating >= 4.0) return <Badge className="bg-blue-600">Bom</Badge>
    if (rating >= 3.5) return <Badge className="bg-yellow-600">Regular</Badge>
    return <Badge variant="destructive">Ruim</Badge>
  }

  const getTrendIcon = (trend: string, variation: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <div className="h-4 w-4" />
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return <div className="p-6">Carregando relatórios financeiros...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Análises e indicadores de performance financeira</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('Financeiro')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-from">Data Início</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Data Fim</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="services">Serviços</SelectItem>
                  <SelectItem value="consulting">Consultoria</SelectItem>
                  <SelectItem value="others">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+5.4% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.netProfit)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">Margem: {kpiData.profitMargin}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contas a Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.outstandingReceivables)}</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-red-600">{formatCurrency(kpiData.overdueReceivables)} em atraso</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fluxo de Caixa</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.cashFlow)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-muted-foreground">Liquidez: {kpiData.liquidityRatio}x</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="revenue">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
                <CardDescription>Distribuição das receitas por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição dos gastos operacionais</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" fill="#8884d8">
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Mensal</CardTitle>
              <CardDescription>Entradas, saídas e saldo acumulado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="inflows" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Entradas" />
                  <Area type="monotone" dataKey="outflows" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Saídas" />
                  <Line type="monotone" dataKey="accumulated" stroke="#3B82F6" strokeWidth={3} name="Acumulado" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>Performance e comportamento dos clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Receita Total</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Faturas</TableHead>
                    <TableHead>Prazo Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAnalysis.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.customer}</TableCell>
                      <TableCell>{formatCurrency(customer.totalRevenue)}</TableCell>
                      <TableCell>{formatCurrency(customer.avgTicket)}</TableCell>
                      <TableCell>{customer.invoices}</TableCell>
                      <TableCell>{customer.daysToPay} dias</TableCell>
                      <TableCell>
                        <Badge className={getCustomerStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Mensal</CardTitle>
              <CardDescription>Variações dos principais indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Mês Atual</TableHead>
                    <TableHead>Mês Anterior</TableHead>
                    <TableHead>Variação</TableHead>
                    <TableHead>Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.metric}</TableCell>
                      <TableCell>
                        {item.metric.includes('%') 
                          ? `${item.currentMonth}%` 
                          : formatCurrency(item.currentMonth)
                        }
                      </TableCell>
                      <TableCell>
                        {item.metric.includes('%') 
                          ? `${item.previousMonth}%` 
                          : formatCurrency(item.previousMonth)
                        }
                      </TableCell>
                      <TableCell className={item.variation > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.variation > 0 ? '+' : ''}{item.variation}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTrendIcon(item.trend, item.variation)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FinancialReports