import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { useExecutiveDashboard } from '@/hooks/useExecutiveDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ExecutiveDashboard() {
  const { loading, kpis, monthlyData } = useExecutiveDashboard()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!kpis) return null

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receita Mensal</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(kpis.revenue.current)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {kpis.revenue.growth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${kpis.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(kpis.revenue.growth)}
              </span>
              <span className="text-sm text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lucro Líquido</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(kpis.profit.current)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {kpis.profit.margin.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">margem</span>
            </div>
          </CardContent>
        </Card>

        {/* Capital de Giro */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Capital de Giro</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(kpis.workingCapital)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {kpis.liquidityRatio.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">índice de liquidez</span>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket Médio</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(kpis.averageTicket)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">por transação</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>Status dos recebíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a Receber</span>
              <span className="font-semibold">{formatCurrency(kpis.receivables.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vencidos</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-destructive">
                  {formatCurrency(kpis.receivables.overdue)}
                </span>
                <Badge variant="destructive">
                  {kpis.receivables.overduePercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar</CardTitle>
            <CardDescription>Status dos pagamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a Pagar</span>
              <span className="font-semibold">{formatCurrency(kpis.payables.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vencidos</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-destructive">
                  {formatCurrency(kpis.payables.overdue)}
                </span>
                <Badge variant="destructive">
                  {kpis.payables.overduePercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução nos Últimos 6 Meses</CardTitle>
          <CardDescription>Receitas, despesas e lucro mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
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
            }}
            className="h-80"
          >
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value: any) => formatCurrency(Number(value))} />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Receita"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Despesas"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="Lucro"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
