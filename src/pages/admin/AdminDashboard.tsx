import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanManagement } from "@/components/admin/PlanManagement"
import { OrganizationsManagement } from "@/components/admin/OrganizationsManagement"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Shield, Lock, Building2, Users, DollarSign, TrendingUp, RefreshCw } from "lucide-react"
import { useAdminMetrics } from "@/hooks/useAdminMetrics"
import { MetricCard } from "@/components/admin/MetricCard"
import { PlanDistributionChart } from "@/components/admin/PlanDistributionChart"
import { RecentOrganizationsTable } from "@/components/admin/RecentOrganizationsTable"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { isSuperAdmin, loading } = useSuperAdmin()
  const { metrics, loading: metricsLoading, refreshMetrics } = useAdminMetrics()
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema e gerenciamento
            </p>
          </div>
        </div>
        <Button 
          onClick={refreshMetrics} 
          variant="outline" 
          size="sm"
          disabled={metricsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="organizations">Empresas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metricsLoading ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[400px]" />
              </div>
            </>
          ) : metrics ? (
            <>
              {/* Métricas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Organizações"
                  value={metrics.totalOrganizations}
                  icon={Building2}
                  growth={metrics.organizationsGrowth}
                  description="Total de empresas cadastradas"
                />
                <MetricCard
                  title="Usuários"
                  value={metrics.totalUsers}
                  icon={Users}
                  growth={metrics.usersGrowth}
                  description="Total de usuários ativos"
                />
                <MetricCard
                  title="Receita Total"
                  value={metrics.totalRevenue}
                  icon={DollarSign}
                  format="currency"
                  description="Total de receitas recebidas"
                />
                <MetricCard
                  title="Lançamentos"
                  value={metrics.totalFinancialEntries}
                  icon={TrendingUp}
                  growth={metrics.entriesGrowth}
                  description="Total de lançamentos financeiros"
                />
              </div>

              {/* Gráficos e Tabelas */}
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.planDistribution.length > 0 && (
                  <PlanDistributionChart data={metrics.planDistribution} />
                )}
                {metrics.recentOrganizations.length > 0 && (
                  <RecentOrganizationsTable organizations={metrics.recentOrganizations} />
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhuma métrica disponível no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationsManagement />
        </TabsContent>

        <TabsContent value="plans">
          <PlanManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
