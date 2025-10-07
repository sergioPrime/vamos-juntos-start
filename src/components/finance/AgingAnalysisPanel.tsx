import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { useAgingAnalysis } from '@/hooks/useAgingAnalysis'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function AgingAnalysisPanel() {
  const { loading, agingData } = useAgingAnalysis()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getColorByRange = (range: string) => {
    if (range.includes('vencer')) return 'hsl(var(--primary))'
    if (range.includes('1-30')) return 'hsl(var(--secondary))'
    if (range.includes('31-60')) return 'hsl(220, 70%, 50%)'
    if (range.includes('61-90')) return 'hsl(30, 80%, 55%)'
    if (range.includes('91-180')) return 'hsl(15, 80%, 50%)'
    return 'hsl(var(--destructive))'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Aging (Vencimentos)</CardTitle>
          <CardDescription>Classificação de recebíveis por faixa de vencimento</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!agingData || agingData.total_count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Aging (Vencimentos)</CardTitle>
          <CardDescription>Classificação de recebíveis por faixa de vencimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum recebível pendente</h3>
            <p className="text-sm text-muted-foreground">
              Não há contas a receber para análise de aging
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    agingData.current,
    agingData.days_1_30,
    agingData.days_31_60,
    agingData.days_61_90,
    agingData.days_91_180,
    agingData.over_180
  ].filter(bucket => bucket.amount > 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Aging (Vencimentos)</CardTitle>
          <CardDescription>
            Total de R$ {formatCurrency(agingData.total_receivables)} em {agingData.total_count} recebíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Resumo em cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">A Vencer</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(agingData.current.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {agingData.current.percentage.toFixed(1)}% do total
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Vencido até 90 dias</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(agingData.days_1_30.amount + agingData.days_31_60.amount + agingData.days_61_90.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((agingData.days_1_30.percentage + agingData.days_31_60.percentage + agingData.days_61_90.percentage)).toFixed(1)}% do total
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Vencido +90 dias</div>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(agingData.days_91_180.amount + agingData.over_180.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((agingData.days_91_180.percentage + agingData.over_180.percentage)).toFixed(1)}% do total
                </div>
              </div>
            </div>

            {/* Gráfico de barras */}
            <ChartContainer
              config={{
                amount: {
                  label: "Valor",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value: any) => formatCurrency(Number(value))} />} />
                <Bar dataKey="amount" name="Valor" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByRange(entry.range)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Tabela detalhada */}
            <div>
              <h4 className="font-semibold mb-3">Detalhamento por Faixa</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa de Vencimento</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((bucket, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{bucket.range}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{bucket.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(bucket.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {bucket.percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise por Cliente */}
      {agingData.by_customer.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes com Maior Saldo Vencido</CardTitle>
            <CardDescription>Clientes ordenados por valor vencido</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">% Vencido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingData.by_customer.slice(0, 10).map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">{customer.customer_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.total_amount)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(customer.overdue_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.total_amount > 0 
                        ? ((customer.overdue_amount / customer.total_amount) * 100).toFixed(1)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
