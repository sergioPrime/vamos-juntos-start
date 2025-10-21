import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  title?: string;
  description?: string;
}

export function CashFlowChart({ data, title, description }: CashFlowChartProps) {
  const totalInflow = data.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = data.reduce((sum, item) => sum + item.outflow, 0);
  const netFlow = totalInflow - totalOutflow;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title || 'Fluxo de Caixa'}</CardTitle>
            <CardDescription>
              {description || 'Entradas e saídas ao longo do tempo'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-2 ${netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netFlow >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="text-2xl font-bold">{formatCurrency(Math.abs(netFlow))}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Fluxo líquido no período
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-success/5 border-success/20">
            <div className="text-sm text-muted-foreground mb-1">Total de Entradas</div>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalInflow)}</div>
          </div>
          <div className="p-4 border rounded-lg bg-destructive/5 border-destructive/20">
            <div className="text-sm text-muted-foreground mb-1">Total de Saídas</div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOutflow)}</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="inflow" 
              stackId="1"
              stroke="hsl(var(--success))" 
              fill="hsl(var(--success))"
              fillOpacity={0.6}
              name="Entradas"
            />
            <Area 
              type="monotone" 
              dataKey="outflow" 
              stackId="2"
              stroke="hsl(var(--destructive))" 
              fill="hsl(var(--destructive))"
              fillOpacity={0.6}
              name="Saídas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
