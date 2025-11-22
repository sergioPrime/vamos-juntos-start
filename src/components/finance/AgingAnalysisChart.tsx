import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgingAnalysis } from '@/hooks/useFinancialReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface AgingAnalysisChartProps {
  data: AgingAnalysis;
}

export function AgingAnalysisChart({ data }: AgingAnalysisChartProps) {
  const chartData = [
    { name: data.current.range, valor: data.current.amount, qtd: data.current.count },
    { name: data.days_1_30.range, valor: data.days_1_30.amount, qtd: data.days_1_30.count },
    { name: data.days_31_60.range, valor: data.days_31_60.amount, qtd: data.days_31_60.count },
    { name: data.days_61_90.range, valor: data.days_61_90.amount, qtd: data.days_61_90.count },
    { name: data.over_90.range, valor: data.over_90.amount, qtd: data.over_90.count }
  ];

  const colors = [
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--destructive))'
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Análise Aging - Contas a Receber
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-sm"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  className="text-sm"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
                        <p className="font-semibold mb-2">{payload[0].payload.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Valor: <span className="font-semibold text-foreground">
                            {formatCurrency(payload[0].payload.valor)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: <span className="font-semibold text-foreground">
                            {payload[0].payload.qtd} parcela(s)
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="valor" name="Valor em Aberto" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela Resumo */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Faixa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Quantidade</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Valor</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  data.current,
                  data.days_1_30,
                  data.days_31_60,
                  data.days_61_90,
                  data.over_90
                ].map((bucket, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{bucket.range}</td>
                    <td className="px-4 py-3 text-sm text-right">{bucket.count}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {formatCurrency(bucket.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {bucket.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted font-semibold">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-sm text-right">{data.total_count}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(data.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Alertas */}
          {data.over_90.amount > 0 && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Atenção: {formatCurrency(data.over_90.amount)} em títulos com mais de 90 dias de atraso
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
