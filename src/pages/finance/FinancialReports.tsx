import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar } from "recharts"
import { CalendarIcon, Download, Filter, TrendingUp, TrendingDown, Users, Building, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"
import { formatCurrency } from "@/hooks/useCountUp"

export default function FinancialReports() {
  const { toast } = useToast()
  const organization = useOrganization()
  
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalBalance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    pendingReceivables: 0,
    overdueAmount: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalProducts: 0
  })
  const [cashFlowData, setCashFlowData] = useState<any[]>([])
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])
  const [allInvoices, setAllInvoices] = useState<any[]>([])
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [allFinancialEntries, setAllFinancialEntries] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      // Set default date range to last 6 months
      const today = new Date()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(today.getMonth() - 6)
      
      setDateFrom(sixMonthsAgo)
      setDateTo(today)
    }
  }, [organization])

  useEffect(() => {
    if (organization?.currentOrg?.id && dateFrom && dateTo) {
      loadAllData()
    }
  }, [organization, dateFrom, dateTo])

  const loadAllData = async () => {
    if (!organization?.currentOrg?.id || !dateFrom || !dateTo) return
    
    try {
      setLoading(true)
      
      // Load bank accounts balance
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("org_id", organization.currentOrg.id)
        .eq("is_active", true)

      const totalBalance = bankAccounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0

      // Load invoices within date range
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("org_id", organization.currentOrg.id)
        .gte("created_at", dateFrom.toISOString())
        .lte("created_at", dateTo.toISOString())

      setAllInvoices(invoices || [])

      // Load transactions within date range
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("org_id", organization.currentOrg.id)
        .gte("transaction_date", dateFrom.toISOString().split('T')[0])
        .lte("transaction_date", dateTo.toISOString().split('T')[0])

      setAllTransactions(transactions || [])

      // Load financial entries within date range
      const { data: financialEntries } = await supabase
        .from("financial_entries")
        .select(`
          *,
          chart_of_accounts (account_name, account_code),
          pessoas!financial_entries_person_id_fkey (nome_fantasia)
        `)
        .eq("org_id", organization.currentOrg.id)
        .gte("due_date", dateFrom.toISOString().split('T')[0])
        .lte("due_date", dateTo.toISOString().split('T')[0])

      setAllFinancialEntries(financialEntries || [])

      // Get counts
      const [
        { count: totalCustomers },
        { count: totalProducts }
      ] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("org_id", organization.currentOrg.id),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("org_id", organization.currentOrg.id)
      ])

      // Calculate metrics from loaded data
      calculateMetrics(invoices || [], transactions || [], financialEntries || [], totalBalance, totalCustomers || 0, totalProducts || 0)
      
    } catch (error) {
      console.error("Error loading financial data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (invoices: any[], transactions: any[], financialEntries: any[], totalBalance: number, totalCustomers: number, totalProducts: number) => {
    const paidInvoices = invoices.filter(i => i.status === "paid")
    const pendingInvoices = invoices.filter(i => i.status === "pending")
    
    // Calculate revenue from invoices and financial entries (receivables)
    const invoiceRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    const settledReceivables = financialEntries
      .filter(entry => entry.entry_type === "receivable" && entry.is_settled)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
    const monthlyRevenue = invoiceRevenue + settledReceivables
    
    // Calculate pending receivables from invoices and financial entries
    const invoicePending = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    const entriesPending = financialEntries
      .filter(entry => entry.entry_type === "receivable" && !entry.is_settled)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
    const pendingReceivables = invoicePending + entriesPending
    
    const today = new Date()
    const invoiceOverdue = pendingInvoices
      .filter(invoice => invoice.due_date && new Date(invoice.due_date) < today)
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    const entriesOverdue = financialEntries
      .filter(entry => !entry.is_settled && entry.due_date && new Date(entry.due_date) < today)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
    const overdueAmount = invoiceOverdue + entriesOverdue

    // Calculate expenses from transactions and financial entries (payables)
    const transactionExpenses = transactions.filter(t => t.transaction_type === 'outflow').reduce((sum, t) => sum + Number(t.amount), 0)
    const settledPayables = financialEntries
      .filter(entry => entry.entry_type === "payable" && entry.is_settled)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
    const monthlyExpenses = transactionExpenses + settledPayables

    setMetrics({
      totalBalance,
      monthlyRevenue,
      monthlyExpenses,
      pendingReceivables,
      overdueAmount,
      totalCustomers,
      totalInvoices: invoices.length + financialEntries.length,
      totalProducts
    })

    // Calculate cash flow including financial entries
    const monthlyData: { [key: string]: { inflow: number, outflow: number } } = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflow: 0, outflow: 0 }
      }
      
      const amount = Number(transaction.amount)
      if (transaction.transaction_type === 'inflow') {
        monthlyData[monthKey].inflow += amount
      } else {
        monthlyData[monthKey].outflow += amount
      }
    })

    // Add financial entries to cash flow
    financialEntries.forEach(entry => {
      if (entry.is_settled && entry.settled_at) {
        const date = new Date(entry.settled_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { inflow: 0, outflow: 0 }
        }
        
        const amount = Number(entry.amount)
        if (entry.entry_type === 'receivable') {
          monthlyData[monthKey].inflow += amount
        } else {
          monthlyData[monthKey].outflow += amount
        }
      }
    })

    let balance = 0
    const cashFlowArray = Object.entries(monthlyData).map(([monthKey, data]) => {
      balance += data.inflow - data.outflow
      return {
        date: monthKey,
        inflow: data.inflow,
        outflow: data.outflow,
        balance
      }
    })

    setCashFlowData(cashFlowArray)

    // Calculate revenue by category
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    setRevenueByCategory(totalRevenue > 0 ? [
      { category: "Serviços", amount: totalRevenue, count: paidInvoices.length, color: "hsl(var(--primary))" }
    ] : [])

    // Calculate expenses by category including financial entries
    const expensesByCategory: { [key: string]: { amount: number, count: number } } = {}
    
    transactions.filter(t => t.transaction_type === 'outflow').forEach(transaction => {
      const category = transaction.category || "Outros"
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = { amount: 0, count: 0 }
      }
      expensesByCategory[category].amount += Number(transaction.amount)
      expensesByCategory[category].count += 1
    })

    // Add payables from financial entries
    financialEntries.filter(entry => entry.entry_type === 'payable' && entry.is_settled).forEach(entry => {
      const category = entry.chart_of_accounts?.account_name || "Outros"
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = { amount: 0, count: 0 }
      }
      expensesByCategory[category].amount += Number(entry.amount)
      expensesByCategory[category].count += 1
    })

    const expensesArray = Object.entries(expensesByCategory).map(([category, data], index) => {
      const colors = ["hsl(var(--destructive))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"]
      return {
        category,
        amount: data.amount,
        count: data.count,
        color: colors[index % colors.length]
      }
    })

    setExpensesByCategory(expensesArray)
  }

  const applyFilters = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Atenção",
        description: "Selecione as datas inicial e final para aplicar os filtros",
        variant: "destructive"
      })
      return
    }

    if (dateFrom > dateTo) {
      toast({
        title: "Atenção",
        description: "A data inicial não pode ser maior que a data final",
        variant: "destructive"
      })
      return
    }

    loadAllData()
    
    toast({
      title: "Filtros aplicados",
      description: `Exibindo dados de ${format(dateFrom, "dd/MM/yyyy")} até ${format(dateTo, "dd/MM/yyyy")}`,
    })
  }

  const exportReport = (format: 'pdf' | 'excel') => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Atenção",
        description: "Selecione as datas para exportar o relatório",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Exportação",
      description: `Preparando exportação em ${format.toUpperCase()}...`,
    })
    
    // Aqui você pode implementar a lógica de exportação usando bibliotecas como
    // xlsx para Excel ou jsPDF para PDF
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Análise detalhada baseada em dados reais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('excel')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="services">Serviços</SelectItem>
                  <SelectItem value="consulting">Consultoria</SelectItem>
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

      {/* KPI Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Contas bancárias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Faturamento do mês</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.pendingReceivables)}</div>
            <p className="text-xs text-muted-foreground">Faturas pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(metrics.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">Valores vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Categoria</CardTitle>
                <CardDescription>Distribuição da receita por categoria de produto/serviço</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueByCategory.length > 0 ? (
                  <ChartContainer config={{}} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByCategory}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="amount"
                          label={({ category, amount }: any) => `${category}: ${formatCurrency(Number(amount) || 0)}`}
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Dados de receita por categoria não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Análise das despesas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length > 0 ? (
                  <ChartContainer config={{}} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expensesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--destructive))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Dados de despesas por categoria não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Tendências mensais de entrada e saída de caixa</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length > 0 ? (
                <ChartContainer config={{}} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area type="monotone" dataKey="inflow" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Entradas" />
                      <Area type="monotone" dataKey="outflow" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" name="Saídas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Dados de fluxo de caixa não disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Receita</CardTitle>
              <CardDescription>Detalhamento das receitas por período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Receita Mensal</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
                  <div className="text-sm text-muted-foreground">Faturas Emitidas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {metrics.totalInvoices > 0 ? formatCurrency(metrics.monthlyRevenue / metrics.totalInvoices) : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Despesas</CardTitle>
              <CardDescription>Detalhamento das despesas por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="space-y-4">
                  {expensesByCategory.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        <div className="text-sm text-muted-foreground">{expense.count} transações</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(expense.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma despesa registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>Performance e comportamento dos clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Análise de Clientes</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  A análise detalhada de clientes será exibida conforme mais dados forem acumulados no sistema.
                  Inclui métricas como ticket médio, frequência de compras e valor total por cliente.
                </p>
                <div className="grid gap-4 md:grid-cols-3 mt-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
                    <div className="text-sm text-muted-foreground">Total de Clientes</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
                    <div className="text-sm text-muted-foreground">Faturas Emitidas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {metrics.totalCustomers > 0 ? formatCurrency(metrics.monthlyRevenue / metrics.totalCustomers) : formatCurrency(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Ticket Médio</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Comparativo</CardTitle>
              <CardDescription>Principais métricas financeiras atuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Saldo Total</span>
                      <span className="text-lg font-bold">{formatCurrency(metrics.totalBalance)}</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Receita Mensal</span>
                      <span className="text-lg font-bold">{formatCurrency(metrics.monthlyRevenue)}</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">A Receber</span>
                      <span className="text-lg font-bold">{formatCurrency(metrics.pendingReceivables)}</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Em Atraso</span>
                      <span className="text-lg font-bold text-destructive">{formatCurrency(metrics.overdueAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}