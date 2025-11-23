import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { MetricCard } from './MetricCard';
import { PlanDistributionChart } from './PlanDistributionChart';
import { RecentOrganizationsTable } from './RecentOrganizationsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CreditCard, TrendingUp, Users } from 'lucide-react';

export function AdminAnalytics() {
  const { metrics, planDistribution, recentOrgs, isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Organizações"
          value={metrics.totalOrganizations}
          icon={Building2}
          trend={metrics.orgGrowth}
        />
        <MetricCard
          title="Assinaturas Ativas"
          value={metrics.activeSubscriptions}
          icon={CreditCard}
          trend={metrics.subscriptionGrowth}
        />
        <MetricCard
          title="Total de Usuários"
          value={metrics.totalUsers}
          icon={Users}
          trend={metrics.userGrowth}
        />
        <MetricCard
          title="MRR"
          value={`R$ ${metrics.mrr.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          trend={metrics.mrrGrowth}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PlanDistributionChart data={planDistribution} />
        <RecentOrganizationsTable organizations={recentOrgs} />
      </div>
    </div>
  );
}
