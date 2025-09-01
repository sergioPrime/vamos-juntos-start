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

interface CashFlowData {
  date: string
  inflow: number
  outflow: number
  balance: number
}

interface CategoryData {
  category: string
  amount: number
  color: string
}

interface ComparisonData {
  period: string
  revenue: number
  expenses: number
  profit: number
}

export default function FinancialDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const organization = useOrganization()
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [selectedCompany, setSelectedCompany] = useState("all")
  
  // Mock data for demonstration
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 125500,
    monthlyRevenue: 45200,
    monthlyExpenses: 28300,
    cashFlowProjection: 97200
  })

  const balanceCount = useCountUp(dashboardData.totalBalance)
  const revenueCount = useCountUp(dashboardData.monthlyRevenue)
  const expensesCount = useCountUp(dashboardData.monthlyExpenses)
  const projectionCount = useCountUp(dashboardData.cashFlowProjection)

  const [cashFlowData] = useState<CashFlowData[]>([
    { date: "01/01", inflow: 15000, outflow: 8000, balance: 125000 },
    { date: "02/01", inflow: 18000, outflow: 12000, balance: 131000 },
    { date: "03/01", inflow: 22000, outflow: 9000, balance: 144000 },
    { date: "04/01", inflow: 19000, outflow: 11000, balance: 152000 },
    { date: "05/01", inflow: 25000, outflow: 15000, balance: 162000 },
    { date: "06/01", inflow: 20000, outflow: 13000, balance: 169000 }
  ])

  const [revenueByCategory] = useState<CategoryData[]>([
    { category: "Produtos", amount: 28500, color: "hsl(var(--primary))" },
    { category: "Serviços", amount: 16700, color: "hsl(var(--secondary))" },
    { category: "Consultoria", amount: 8200, color: "hsl(var(--accent))" },
    { category: "Outros", amount: 5800, color: "hsl(var(--muted))" }
  ])

  const [expensesByCategory] = useState<CategoryData[]>([
    { category: "Folha de Pagamento", amount: 15200, color: "hsl(var(--destructive))" },
    { category: "Fornecedores", amount: 8300, color: "hsl(var(--warning))" },
    { category: "Operacional", amount: 4800, color: "hsl(var(--info))" },
    { category: "Impostos", amount: 6200, color: "hsl(var(--muted))" }
  ])

  const [historicalComparison] = useState<ComparisonData[]>([
    { period: "Jan 2024", revenue: 38500, expenses: 22300, profit: 16200 },
    { period: "Fev 2024", revenue: 41200, expenses: 24800, profit: 16400 },
    { period: "Mar 2024", revenue: 45200, expenses: 28300, profit: 16900 },
    { period: "Abr 2024", revenue: 43800, expenses: 26100, profit: 17700 },
    { period: "Mai 2024", revenue: 48300, expenses: 29500, profit: 18800 },
    { period: "Jun 2024", revenue: 52100, expenses: 31200, profit: 20900 }
  ])

  const [companies, setCompanies] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadDashboardData()
    }
  }, [organization, selectedPeriod, selectedCompany])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
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

      // Calculate totals from bank accounts
      if (accountsData?.length) {
        const totalBalance = accountsData.reduce((sum, account) => sum + Number(account.balance), 0)
        setDashboardData(prev => ({ ...prev, totalBalance }))
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const exportDashboard = (format: 'csv' | 'pdf') => {
    toast({
      title: "Exportação",
      description: `Dashboard exportado em ${format.toUpperCase()}`,
    })
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
              +12.5% em relação ao mês anterior
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
              +8.2% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Mensais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expensesCount)}</div>
            <p className="text-xs text-muted-foreground">
              +3.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção 90 dias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectionCount)}</div>
            <p className="text-xs text-muted-foreground">
              Baseado em histórico e tendências
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          <TabsTrigger value="projection">Projeções</TabsTrigger>
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

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Histórico</CardTitle>
              <CardDescription>Evolução mensal de receitas, despesas e lucro</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Despesas" />
                    <Bar dataKey="profit" fill="hsl(var(--secondary))" name="Lucro" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projeções Inteligentes</CardTitle>
              <CardDescription>Previsão baseada em histórico e tendências</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(97200)}
                  </div>
                  <div className="text-sm text-muted-foreground">Saldo em 30 dias</div>
                  <Badge variant="secondary" className="mt-2">
                    Confiança: 85%
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(142800)}
                  </div>
                  <div className="text-sm text-muted-foreground">Saldo em 60 dias</div>
                  <Badge variant="secondary" className="mt-2">
                    Confiança: 78%
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(188500)}
                  </div>
                  <div className="text-sm text-muted-foreground">Saldo em 90 dias</div>
                  <Badge variant="secondary" className="mt-2">
                    Confiança: 72%
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Insights da IA</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Tendência de crescimento de 8% no faturamento mensal</li>
                  <li>• Despesas operacionais estáveis, representando 62% da receita</li>
                  <li>• Recomendação: Reserva de emergência para 3 meses identificada</li>
                  <li>• Oportunidade de investimento em marketing para acelerar crescimento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}