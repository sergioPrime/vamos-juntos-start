import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, TrendingUp, Users, Plus } from 'lucide-react';
import { useSubscriptionMetrics } from '@/hooks/useSubscriptionMetrics';
import { useState } from 'react';
import { CreateLicenseDialog } from './CreateLicenseDialog';

export function LicenseMetricsCards() {
  const { metrics, isLoading } = useSubscriptionMetrics();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Licenças Expiradas</p>
              <p className="text-3xl font-bold text-destructive">{metrics.expiredLicenses}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Necessitam renovação urgente</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiram Hoje</p>
              <p className="text-3xl font-bold text-orange-500">{metrics.expiresToday}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Expirando nas próximas 24h</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Próximos 7 dias</p>
              <p className="text-3xl font-bold text-yellow-500">{metrics.expiresNext7Days}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Requer atenção em breve</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Organizações</p>
              <p className="text-3xl font-bold">{metrics.totalOrganizations}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalUsers} usuários
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Ações Rápidas</h3>
            <p className="text-sm text-muted-foreground">Gerencie licenças rapidamente</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Nova Licença
          </Button>
        </div>
      </Card>

      <CreateLicenseDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
