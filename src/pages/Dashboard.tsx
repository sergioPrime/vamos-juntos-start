import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, TrendingUp, Wallet, FileText, Quote, Users, BarChart3, Zap, Receipt, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useCountUp, formatCurrency } from "@/hooks/useCountUp"
import { useNotifications } from "@/components/ui/notification-system"
import { useDashboardData } from "@/hooks/useDashboardData"

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [isPulsing, setIsPulsing] = useState(false)
  const { metrics, loading } = useDashboardData()

  const balanceCount = useCountUp(metrics.currentBalance)
  const revenueCount = useCountUp(metrics.monthlyRevenue)
  const receivablesCount = useCountUp(metrics.receivables)

  const handlePixClick = () => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 1000)
    
    toast({
      title: "Navegando para Cobrança PIX",
      description: "Redirecionando para a página de recebíveis",
    })
    
    navigate("/finance/receivables")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Bem-vindo ao seu ERP!
        </h1>
        <p className="text-xl text-muted-foreground">
          Gerencie seu negócio de forma simples e eficiente
        </p>
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balanceCount)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo total nas contas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueCount)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento deste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receivablesCount)}</div>
            <p className="text-xs text-muted-foreground">
              Valores pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PIX Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          className={`text-lg px-8 py-6 ${isPulsing ? 'animate-pulse' : ''}`}
          onClick={handlePixClick}
        >
          <Zap className="mr-2 h-5 w-5" />
          Gerar Cobrança PIX
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/charges")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Receipt className="mr-2 h-5 w-5" />
              Fatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Crie e gerencie faturas para seus clientes
            </p>
            <Button variant="ghost" className="w-full justify-start p-0">
              Criar fatura <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/quotes")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <FileText className="mr-2 h-5 w-5" />
              Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Prepare orçamentos profissionais
            </p>
            <Button variant="ghost" className="w-full justify-start p-0">
              Novo orçamento <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/customers")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Users className="mr-2 h-5 w-5" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Gerencie sua base de clientes
            </p>
            <Button variant="ghost" className="w-full justify-start p-0">
              Ver clientes <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/finance/dashboard")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <BarChart3 className="mr-2 h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Analise o desempenho do seu negócio
            </p>
            <Button variant="ghost" className="w-full justify-start p-0">
              Ver relatórios <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas movimentações da sua conta
          </p>
        </CardHeader>
        <CardContent>
          {metrics.recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma atividade recente encontrada. Comece criando uma fatura ou cadastrando um cliente.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {activity.type === "invoice" && <Receipt className="h-4 w-4 text-primary" />}
                    {activity.type === "customer" && <Users className="h-4 w-4 text-secondary" />}
                    {activity.type === "quote" && <FileText className="h-4 w-4 text-accent" />}
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {activity.amount && (
                    <Badge variant="outline">
                      {formatCurrency(activity.amount)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}