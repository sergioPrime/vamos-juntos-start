import { useAdminAnalytics } from "@/hooks/useAdminAnalytics"
import { MetricCard } from "./MetricCard"
import { PlanDistributionChart } from "./PlanDistributionChart"
import { RecentOrganizationsTable } from "./RecentOrganizationsTable"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Percent,
  UserX
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminAnalytics() {
  const { metrics, loading, error, refresh } = useAdminAnalytics()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">Erro ao carregar métricas: {error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Visão geral das métricas do sistema</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Organizações"
          value={metrics.totalOrganizations}
          icon={Building2}
          trend={{ value: metrics.userGrowth.percentage, label: "últimos 30 dias" }}
          description="Organizações cadastradas"
        />
        <MetricCard
          title="Assinaturas Ativas"
          value={metrics.activeSubscriptions}
          icon={CreditCard}
          trend={{ value: metrics.conversionRate, label: "taxa de conversão" }}
          description="Planos pagos ativos"
        />
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          trend={{ value: metrics.revenueGrowth.percentage, label: "crescimento mensal" }}
          description="Receita acumulada"
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics.monthlyRecurringRevenue)}
          icon={TrendingUp}
          description="Monthly Recurring Revenue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Novos Usuários (30d)"
          value={metrics.userGrowth.current}
          icon={Users}
          description="Crescimento no período"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={Percent}
          description="Orgs com plano pago"
        />
        <MetricCard
          title="ARPU"
          value={formatCurrency(metrics.averageRevenuePerUser)}
          icon={DollarSign}
          description="Average Revenue Per User"
        />
        <MetricCard
          title="Taxa de Churn"
          value={`${metrics.churnRate.toFixed(1)}%`}
          icon={UserX}
          description="Cancelamentos mensais"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlanDistributionChart data={metrics.planDistribution} />
        <RecentOrganizationsTable organizations={metrics.recentOrganizations} />
      </div>
    </div>
  )
}
