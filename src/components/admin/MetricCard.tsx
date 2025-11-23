import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
}

export function MetricCard({ title, value, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+{trend}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{trend}%</span>
              </>
            )}
            <span>vs. mês anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
