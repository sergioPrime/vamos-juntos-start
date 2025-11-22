import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdvancedCashFlowChartProps {
  scenarios: any[];
  metrics: any;
}

export function AdvancedCashFlowChart({ scenarios, metrics }: AdvancedCashFlowChartProps) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Nenhum dado de projeção disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico (reduzir para 30 pontos para melhor visualização)
  const chartData = scenarios
    .filter((_, index) => index % 3 === 0) // Pegar a cada 3 dias
    .map(scenario => ({
      date: format(new Date(scenario.date), 'dd/MMM', { locale: ptBR }),
      fullDate: scenario.date,
      'Otimista': scenario.optimistic,
      'Realista': scenario.realistic,
      'Pessimista': scenario.pessimistic
    }));

  const getTrendIcon = () => {
    if (!metrics) return null;
    if (metrics.trend === 'positive') return <TrendingUp className="h-4 w-4 text-success" />;
    if (metrics.trend === 'negative') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = () => {
    if (!metrics) return null;
    if (metrics.trend === 'positive') return <Badge className="bg-success text-success-foreground">Tendência Positiva</Badge>;
    if (metrics.trend === 'negative') return <Badge variant="destructive">Tendência Negativa</Badge>;
    return <Badge variant="secondary">Tendência Neutra</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Projeção de Fluxo de Caixa - Múltiplos Cenários
              {getTrendIcon()}
            </CardTitle>
            <CardDescription>
              Projeções para os próximos {Math.floor(scenarios.length)} dias com cenários otimista, realista e pessimista
            </CardDescription>
          </div>
          {getTrendBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            Otimista: {
              label: 'Cenário Otimista',
              color: 'hsl(var(--success))'
            },
            Realista: {
              label: 'Cenário Realista',
              color: 'hsl(var(--primary))'
            },
            Pessimista: {
              label: 'Cenário Pessimista',
              color: 'hsl(var(--destructive))'
            }
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold mb-2">
                        {format(new Date(data.fullDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-medium">{formatCurrency(entry.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Otimista"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="Realista"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Pessimista"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(metrics.current_balance)}</div>
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(metrics.projected_30d)}</div>
              <p className="text-xs text-muted-foreground">Projeção 30 dias</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(metrics.avg_daily_inflow)}</div>
              <p className="text-xs text-muted-foreground">Entrada Média Diária</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(metrics.avg_daily_outflow)}</div>
              <p className="text-xs text-muted-foreground">Saída Média Diária</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
