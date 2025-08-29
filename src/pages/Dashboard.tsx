import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, TrendingUp, Wallet, FileText, Quote, Users, BarChart3, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useCountUp, formatCurrency } from "@/hooks/useCountUp"
import { useNotifications } from "@/components/ui/notification-system"

const mockActivities = [
  { id: 1, type: "payment", client: "João Silva", value: "R$ 850,00", date: "Hoje", status: "paid" },
  { id: 2, type: "quote", client: "Maria Santos", value: "R$ 1.200,00", date: "Ontem", status: "pending" },
  { id: 3, type: "invoice", client: "Empresa ABC", value: "R$ 2.500,00", date: "2 dias", status: "issued" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [isPulsing, setIsPulsing] = useState(false)
  
  // Count-up animations for metrics
  const currentBalance = useCountUp(12580, 800)
  const todayReceivables = useCountUp(2350, 800, 0)
  const weeklyReceivables = useCountUp(8750, 800, 0)

  const handlePixClick = () => {
    setIsPulsing(true)
    setTimeout(() => {
      setIsPulsing(false)
      navigate("/finance/receivables")
    }, 200)
  }

  // Demo reminder notification (simulate periodic reminders)
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        type: 'reminder',
        title: '⚡ Lembrete de Cobrança',
        message: '3 cobranças vencem hoje! Envie lembretes via Pix.',
        duration: 6000
      })
    }, 5000) // Show after 5 seconds for demo

    return () => clearTimeout(timer)
  }, [addNotification])

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quanto você já faturou este mês 🚀</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Acompanhe seu crescimento em tempo real</p>
      </div>

      {/* Cards de métricas - responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary currency">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary currency">
              {formatCurrency(todayReceivables)}
            </div>
            <p className="text-xs text-muted-foreground">3 cobranças pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber na Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary currency">
              {formatCurrency(weeklyReceivables)}
            </div>
            <p className="text-xs text-muted-foreground">12 cobranças em aberto</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão Principal PIX - responsive */}
      <div className="flex justify-center animate-fade-in px-4">
        <Button 
          onClick={handlePixClick}
          className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold transition-all duration-200 w-full sm:w-auto max-w-sm ${isPulsing ? 'animate-pulse-blue' : ''}`}
          size="lg"
        >
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
          Gerar Cobrança Pix
        </Button>
      </div>

      {/* Cards de Navegação - responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer card-hover transition-all duration-200"
          onClick={() => navigate("/nfse")}
        >
          <CardContent className="p-4 sm:p-6 text-center animate-[staggerFadeIn_0.5s_ease-out_0.1s_both]">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h3 className="font-semibold text-base sm:text-lg mb-2">Emitir Nota Fiscal</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">NFS-e para seus serviços</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer card-hover transition-all duration-200"
          onClick={() => navigate("/quotes")}
        >
          <CardContent className="p-4 sm:p-6 text-center animate-[staggerFadeIn_0.5s_ease-out_0.2s_both]">
            <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h3 className="font-semibold text-base sm:text-lg mb-2">Novo Orçamento</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Crie propostas profissionais</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer card-hover transition-all duration-200"
          onClick={() => navigate("/customers")}
        >
          <CardContent className="p-4 sm:p-6 text-center animate-[staggerFadeIn_0.5s_ease-out_0.3s_both]">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h3 className="font-semibold text-base sm:text-lg mb-2">Meus Clientes</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie relacionamentos</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer card-hover transition-all duration-200"
          onClick={() => navigate("/reports")}
        >
          <CardContent className="p-4 sm:p-6 text-center animate-[staggerFadeIn_0.5s_ease-out_0.4s_both]">
            <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h3 className="font-semibold text-base sm:text-lg mb-2">Relatórios</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.status === 'paid' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{activity.client}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {activity.type === 'payment' ? 'Pagamento recebido' :
                       activity.type === 'quote' ? 'Orçamento enviado' : 'NFS-e emitida'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-semibold text-sm sm:text-base">{activity.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}