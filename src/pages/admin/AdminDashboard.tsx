import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanManagement } from "@/components/admin/PlanManagement"
import { OrganizationsManagement } from "@/components/admin/OrganizationsManagement"
import { AdminAnalytics } from "@/components/admin/AdminAnalytics"
import { MetricCard } from "@/components/admin/MetricCard"
import { PlanDistributionChart } from "@/components/admin/PlanDistributionChart"
import { RecentOrganizationsTable } from "@/components/admin/RecentOrganizationsTable"
import { useAdminMetrics } from "@/hooks/useAdminMetrics"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Shield, Lock, Users, Building2, DollarSign, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function MetricsGrid() {
  const { metrics, loading } = useAdminMetrics()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total de Empresas"
        value={metrics.totalOrganizations.toString()}
        change={metrics.organizationsGrowth}
        icon={Building2}
      />
      <MetricCard
        title="Total de Usuários"
        value={metrics.totalUsers.toString()}
        change={metrics.usersGrowth}
        icon={Users}
      />
      <MetricCard
        title="Receita Total"
        value={new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(metrics.totalRevenue)}
        change={metrics.revenueGrowth}
        icon={DollarSign}
      />
      <MetricCard
        title="Lançamentos"
        value={metrics.totalFinancialEntries.toString()}
        icon={TrendingUp}
      />
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { isSuperAdmin, loading } = useSuperAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth")
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold">Verificando Permissões</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos seus privilégios de acesso...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="h-12 w-12 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
            <p className="text-muted-foreground max-w-md">
              Você não possui privilégios de Super Administrador necessários para acessar o painel administrativo.
            </p>
          </div>
          
          <Card className="max-w-md mx-auto border-destructive/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Acesso restrito a Super Administradores</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se você acredita que deveria ter acesso, entre em contato com um administrador do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie planos, empresas e visualize analytics da plataforma
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <MetricsGrid />
          <div className="grid gap-4 md:grid-cols-2">
            <PlanDistributionChart />
            <RecentOrganizationsTable />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="plans">
          <PlanManagement />
        </TabsContent>

        <TabsContent value="empresas">
          <OrganizationsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
