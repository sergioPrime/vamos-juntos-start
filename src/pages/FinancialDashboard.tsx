import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, CreditCard, TrendingUp, TrendingDown, Calendar, Download, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { formatCurrency, useCountUp } from "@/hooks/useCountUp"
import { useFinancialData } from "@/hooks/useFinancialData"
import { BankReconciliation } from "@/components/finance/BankReconciliation"
import { CashFlowProjectionChart } from "@/components/finance/CashFlowProjectionChart"
import { FinancialAlertsPanel } from "@/components/finance/FinancialAlertsPanel"
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/financialExport"

export default function FinancialDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const organization = useOrganization()
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [companies, setCompanies] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  
  const { metrics, cashFlowData, revenueByCategory, expensesByCategory, loading } = useFinancialData()

  const balanceCount = useCountUp(metrics.totalBalance)
  const revenueCount = useCountUp(metrics.monthlyRevenue)
  const expensesCount = useCountUp(metrics.monthlyExpenses)
  const projectionCount = useCountUp(metrics.pendingReceivables)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadAdditionalData()
    }
  }, [organization, selectedPeriod, selectedCompany])

  const loadAdditionalData = async () => {
    try {
      // Load companies
      const { data: companiesData } = await supabase
        .from("companies")
        .select("*")
        .eq("org_id", organization?.currentOrg?.id)
        .eq("is_active", true)

      setCompanies(companiesData || [])

      // Load bank accounts
      const { data: accountsData } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("org_id", organization?.currentOrg?.id)
        .eq("is_active", true)

      setBankAccounts(accountsData || [])

    } catch (error) {
      console.error("Error loading additional data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados adicionais",
        variant: "destructive",
      })
    }
  }

  const generateCashFlowProjection = async () => {
    try {
      const { data } = await supabase.rpc("generate_cash_flow_projections", {
        p_org_id: organization?.currentOrg?.id,
        p_days_ahead: 90
      })
      
      if (data?.length) {
        toast({
          title: "Sucesso",
          description: "Projeção de fluxo de caixa atualizada",
        })
      }
    } catch (error) {
      console.error("Error generating projections:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar projeções",
        variant: "destructive",
      })
    }
  }

  const exportDashboard = async (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = {
      title: 'Dashboard Financeiro',
      subtitle: `Período: Últimos ${selectedPeriod} dias - Gerado em ${new Date().toLocaleString('pt-BR')}`,
      headers: ['Métrica', 'Valor'],
      rows: [
        ['Saldo Total', metrics.totalBalance],
        ['Receita Mensal', metrics.monthlyRevenue],
        ['Despesas Mensais', metrics.monthlyExpenses],
        ['A Receber', metrics.pendingReceivables],
        ['Em Atraso', metrics.overdueAmount],
        ['Total de Clientes', metrics.totalCustomers],
        ['Total de Faturas', metrics.totalInvoices],
        ['Total de Produtos', metrics.totalProducts]
      ]
    }

    try {
      if (format === 'csv') {
        await exportToCSV(exportData)
      } else if (format === 'excel') {
        await exportToExcel(exportData)
      } else {
        await exportToPDF(exportData)
      }
      
      toast({
        title: "Sucesso",
        description: `Dashboard exportado em ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar dashboard",
        variant: "destructive"
      })
    }
  }

  const chartConfig = {
    inflow: {
      label: "Entradas",
      color: "hsl(var(--primary))",
    },
    outflow: {
      label: "Saídas", 
      color: "hsl(var(--destructive))",
    },
    balance: {
      label: "Saldo",
      color: "hsl(var(--secondary))",
    },
    revenue: {
      label: "Receita",
      color: "hsl(var(--primary))",
    },
    expenses: {
      label: "Despesas",
      color: "hsl(var(--destructive))",
    },
    profit: {
      label: "Lucro",
      color: "hsl(var(--secondary))",
    },
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">Visão completa da situação financeira</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {companies.map((company: any) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={generateCashFlowProjection} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Projetar
          </Button>
          
          <Button onClick={() => exportDashboard('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          
          <Button onClick={() => exportDashboard('excel')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button onClick={() => exportDashboard('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balanceCount)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo total nas contas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueCount)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento deste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectionCount)}</div>
            <p className="text-xs text-muted-foreground">
              Valores pendentes de recebimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Categoria</CardTitle>
                <CardDescription>Distribuição da receita nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ category, value }) => `${category}: ${formatCurrency(value)}`}
                      >
                        {revenueByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição das despesas nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ category, value }) => `${category}: ${formatCurrency(value)}`}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Entradas, saídas e saldo acumulado</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stackId="1"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      name="Saldo"
                    />
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      stackId="2"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      name="Entradas"
                    />
                    <Area
                      type="monotone"
                      dataKey="outflow"
                      stackId="3"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive))"
                      name="Saídas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projection" className="space-y-4">
          <CashFlowProjectionChart daysAhead={90} />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <FinancialAlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}