import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  change?: number;
  icon: LucideIcon;
  format?: 'number' | 'currency';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle,
  change, 
  icon: Icon, 
  format = 'number' 
}: MetricCardProps) {
  const formattedValue = format === 'currency' 
    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
    : value.toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{formattedValue}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
        )}
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {change > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">+{change.toFixed(1)}%</span>
              </>
            ) : change < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600 font-medium">{change.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground font-medium">0%</span>
              </>
            )}
            <span>vs mês anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
