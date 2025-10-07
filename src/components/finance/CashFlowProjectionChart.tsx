import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CashFlowProjectionChartProps {
  daysAhead?: number
}

export function CashFlowProjectionChart({ daysAhead = 90 }: CashFlowProjectionChartProps) {
  const { loading, projections } = useCashFlowProjection(daysAhead)

  const chartConfig = {
    projected_balance: {
      label: "Saldo Projetado",
      color: "hsl(var(--primary))",
    },
    projected_inflow: {
      label: "Entradas Projetadas",
      color: "hsl(var(--secondary))",
    },
    projected_outflow: {
      label: "Saídas Projetadas",
      color: "hsl(var(--destructive))",
    },
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const chartData = projections
    .filter((_, index) => index % 7 === 0 || index === projections.length - 1) // Mostrar semanalmente
    .map(projection => ({
      ...projection,
      dateLabel: format(new Date(projection.date), 'dd/MMM', { locale: ptBR })
    }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Projetado</CardTitle>
          <CardDescription>Projeção para os próximos {daysAhead} dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  const lastProjection = projections[projections.length - 1]
  const minBalance = Math.min(...projections.map(p => p.projected_balance))
  const maxBalance = Math.max(...projections.map(p => p.projected_balance))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa Projetado</CardTitle>
        <CardDescription>
          Projeção para os próximos {daysAhead} dias • 
          Saldo final estimado: {formatCurrency(lastProjection?.projected_balance || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Saldo Atual</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(projections[0]?.projected_balance || 0)}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Menor Saldo Projetado</div>
            <div className={`text-2xl font-bold ${minBalance < 0 ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(minBalance)}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Maior Saldo Projetado</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(maxBalance)}
            </div>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="projected_balance"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorBalance)"
                name="Saldo Projetado"
              />
              <Area
                type="monotone"
                dataKey="projected_inflow"
                stroke="hsl(var(--secondary))"
                fill="hsl(var(--secondary))"
                fillOpacity={0.3}
                name="Entradas"
              />
              <Area
                type="monotone"
                dataKey="projected_outflow"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.3}
                name="Saídas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
