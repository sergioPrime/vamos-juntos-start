import { AlertsSection } from "@/components/dashboard/AlertsSection"
import { WelcomeCard } from "@/components/dashboard/WelcomeCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useDashboardData } from "@/hooks/useDashboardData"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  Calendar,
  Clock,
  BarChart3,
  ArrowRight,
  Zap,
  Target
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { metrics, loading } = useDashboardData()
  const navigate = useNavigate()
  
  // Check if this is a new user (simple check - could be enhanced)
  const isNewUser = !metrics || (metrics.currentBalance === 0 && metrics.monthlyRevenue === 0 && metrics.recentActivities?.length === 0)
  const hasNoData = !loading && (!metrics || (metrics.currentBalance === 0 && metrics.monthlyRevenue === 0 && (!metrics.recentActivities || metrics.recentActivities.length === 0)))

  // Get current hour for greeting
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite"
  
  // Get user's first name
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário'

  const quickActions = [
    {
      title: "Nova Venda",
      description: "Registrar venda no PDV",
      icon: <Zap className="h-5 w-5" />,
      action: () => navigate('/pdv'),
      color: "bg-green-500"
    },
    {
      title: "Novo Produto",
      description: "Cadastrar produto",
      icon: <Package className="h-5 w-5" />,
      action: () => navigate('/products'),
      color: "bg-blue-500"
    },
    {
      title: "Lançamento",
      description: "Registro financeiro",
      icon: <DollarSign className="h-5 w-5" />,
      action: () => navigate('/finance/lancamentos'),
      color: "bg-purple-500"
    },
    {
      title: "Relatórios",
      description: "Ver análises",
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => navigate('/finance/reports'),
      color: "bg-orange-500"
    }
  ]

  return (
    <div className="page-container space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do seu negócio hoje
            {currentOrg && (
              <span className="ml-2">
                • <span className="font-medium">{currentOrg.name}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.currentBalance?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponível em contas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.monthlyRevenue?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.receivables?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Em contas pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.recentActivities?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome Card for New Users */}
      {isNewUser && <WelcomeCard />}

      {/* Empty State for completely new systems */}
      {hasNoData && <EmptyState />}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all"
                onClick={action.action}
              >
                <div className={`p-2 rounded-md text-white ${action.color}`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      {!loading && metrics?.recentActivities && metrics.recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {activity.type === 'invoice' && <DollarSign className="h-4 w-4" />}
                    {activity.type === 'customer' && <Users className="h-4 w-4" />}
                    {activity.type === 'quote' && <ShoppingCart className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className="text-sm font-medium">
                      R$ {activity.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      <AlertsSection />
    </div>
  )
}