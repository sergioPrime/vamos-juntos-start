import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalDashboard } from '@/components/fiscal/FiscalDashboard';
import { BarChart3 } from 'lucide-react';

export default function FiscalReports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Fiscais</h1>
            <p className="text-muted-foreground">
              Análise completa de NFes, faturamento e tributos
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>

        <FiscalDashboard />
      </div>
    </AppLayout>
  );
}
