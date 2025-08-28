import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, TrendingUp, Plus, FileText, Calculator } from "lucide-react"
import { useNavigate } from "react-router-dom"

const mockActivities = [
  { id: 1, type: "payment", client: "João Silva", value: "R$ 850,00", date: "Hoje", status: "paid" },
  { id: 2, type: "quote", client: "Maria Santos", value: "R$ 1.200,00", date: "Ontem", status: "pending" },
  { id: 3, type: "invoice", client: "Empresa ABC", value: "R$ 2.500,00", date: "2 dias", status: "issued" },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 12.580,00</div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 2.350,00</div>
            <p className="text-xs text-muted-foreground">3 cobranças pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber na Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 8.750,00</div>
            <p className="text-xs text-muted-foreground">12 cobranças em aberto</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={() => navigate("/charges/new")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Cobrança Pix
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/nfse")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Emitir NFS-e
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/quotes/new")}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'paid' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium">{activity.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === 'payment' ? 'Pagamento recebido' :
                       activity.type === 'quote' ? 'Orçamento enviado' : 'NFS-e emitida'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{activity.value}</p>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}