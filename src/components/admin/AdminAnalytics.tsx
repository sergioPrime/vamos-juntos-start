import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { MetricCard } from './MetricCard';
import { PlanDistributionChart } from './PlanDistributionChart';
import { RecentOrganizationsTable } from './RecentOrganizationsTable';
import { TrendingUp, Users, Building2, DollarSign, Activity, Bell, FileText, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminAnalytics() {
  const { analytics, isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Erro ao carregar analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Organizações"
          value={analytics.totalOrganizations}
          subtitle={`${analytics.activeOrganizations} ativas`}
          change={analytics.growth.organizations}
          icon={Building2}
        />
        <MetricCard
          title="Usuários"
          value={analytics.totalUsers}
          change={analytics.growth.users}
          icon={Users}
        />
        <MetricCard
          title="Assinaturas Ativas"
          value={analytics.activeSubscriptions}
          subtitle={`${analytics.totalOrganizations - analytics.activeSubscriptions} inativos`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Receita Mensal"
          value={analytics.revenue.monthly}
          change={analytics.growth.revenue}
          icon={DollarSign}
          format="currency"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
          <CardDescription>
            Evolução da receita nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  'Receita'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanDistributionChart data={analytics.planDistribution} />
        
        <Card>
          <CardHeader>
            <CardTitle>Top Organizações</CardTitle>
            <CardDescription>
              Organizações com mais usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrganizationsTable organizations={analytics.topOrganizations} />
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde do Sistema
          </CardTitle>
          <CardDescription>
            Métricas de atividade e monitoramento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Logs de Auditoria
              </div>
              <p className="text-2xl font-bold">
                {analytics.systemHealth.totalAuditLogs.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                Notificações
              </div>
              <p className="text-2xl font-bold">
                {analytics.systemHealth.totalNotifications.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.systemHealth.unreadNotifications} não lidas
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Atividade Recente
              </div>
              <p className="text-2xl font-bold">
                {analytics.systemHealth.recentActivity.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Crescimento
              </div>
              <p className="text-2xl font-bold text-green-600">
                +{analytics.growth.organizations.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Organizações/mês
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
