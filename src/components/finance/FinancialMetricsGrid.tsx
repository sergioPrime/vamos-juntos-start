import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Percent
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  colorClass?: string;
}

function MetricCard({ title, value, change, icon, colorClass = 'text-primary' }: MetricCardProps) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`${colorClass} p-2 rounded-lg bg-muted/50`}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2 tracking-tight">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {change >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-muted-foreground font-normal">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalReceivables: number;
  overdueReceivables: number;
  totalPayables: number;
  overduePayables: number;
  averageTicket: number;
  cashBalance: number;
}

interface FinancialMetricsGridProps {
  metrics: FinancialMetrics;
  changes?: Partial<Record<keyof FinancialMetrics, number>>;
}

export function FinancialMetricsGrid({ metrics, changes = {} }: FinancialMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <MetricCard
        title="Receitas"
        value={metrics.totalRevenue}
        change={changes.totalRevenue}
        icon={<TrendingUp className="h-5 w-5" />}
        colorClass="text-success"
      />

      <MetricCard
        title="Despesas"
        value={metrics.totalExpenses}
        change={changes.totalExpenses}
        icon={<TrendingDown className="h-5 w-5" />}
        colorClass="text-destructive"
      />

      <MetricCard
        title="Lucro Líquido"
        value={metrics.netProfit}
        change={changes.netProfit}
        icon={<DollarSign className="h-5 w-5" />}
        colorClass={metrics.netProfit >= 0 ? 'text-success' : 'text-destructive'}
      />

      <MetricCard
        title="Margem de Lucro"
        value={`${metrics.profitMargin.toFixed(1)}%`}
        change={changes.profitMargin}
        icon={<Percent className="h-5 w-5" />}
        colorClass={metrics.profitMargin >= 0 ? 'text-success' : 'text-destructive'}
      />

      <MetricCard
        title="A Receber"
        value={metrics.totalReceivables}
        icon={<Calendar className="h-5 w-5" />}
        colorClass="text-primary"
      />

      <MetricCard
        title="Vencidos (Receber)"
        value={metrics.overdueReceivables}
        icon={<AlertCircle className="h-5 w-5" />}
        colorClass="text-warning"
      />

      <MetricCard
        title="A Pagar"
        value={metrics.totalPayables}
        icon={<Clock className="h-5 w-5" />}
        colorClass="text-primary"
      />

      <MetricCard
        title="Vencidos (Pagar)"
        value={metrics.overduePayables}
        icon={<AlertCircle className="h-5 w-5" />}
        colorClass="text-destructive"
      />

      <MetricCard
        title="Ticket Médio"
        value={metrics.averageTicket}
        change={changes.averageTicket}
        icon={<DollarSign className="h-5 w-5" />}
        colorClass="text-primary"
      />

      <MetricCard
        title="Saldo em Caixa"
        value={metrics.cashBalance}
        icon={<CheckCircle className="h-5 w-5" />}
        colorClass="text-success"
      />
    </div>
  );
}
