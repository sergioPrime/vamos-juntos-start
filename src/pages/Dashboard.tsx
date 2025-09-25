import { useState, useEffect } from "react"
import { AlertsSection } from "@/components/dashboard/AlertsSection"
import { WelcomeCard } from "@/components/dashboard/WelcomeCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { BusinessInsightsPanel } from "@/components/dashboard/BusinessInsightsPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useDashboardData } from "@/hooks/useDashboardData"
import { supabase } from "@/integrations/supabase/client"
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
  const [hasData, setHasData] = useState(false)
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { metrics, loading } = useDashboardData()
  const navigate = useNavigate()

  // Check if user has data in the system
  useEffect(() => {
    const checkForData = async () => {
      if (!currentOrg?.id) return

      try {
        // Check for any data that indicates the user has started using the system
        const [orders, products, customers] = await Promise.all([
          supabase.from('orders').select('id').eq('org_id', currentOrg.id).limit(1),
          supabase.from('products').select('id').eq('org_id', currentOrg.id).limit(1),
          supabase.from('pessoas').select('id').eq('org_id', currentOrg.id).limit(1)
        ])

        const hasAnyData = 
          (orders.data && orders.data.length > 0) ||
          (products.data && products.data.length > 0) ||
          (customers.data && customers.data.length > 0)

        setHasData(hasAnyData)
      } catch (error) {
        console.error('Error checking for data:', error)
      }
    }

    checkForData()
  }, [currentOrg?.id])
  
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

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para acessar o dashboard.
          </p>
          <Button onClick={() => navigate('/settings')}>
            Ir para Configurações
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Saudação */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de controle do Prime ERP
        </p>
      </div>

      {/* Welcome Card para novos usuários */}
      {!hasData && <WelcomeCard />}

      {/* Business Insights ou Empty State */}
      {hasData ? (
        <BusinessInsightsPanel />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}