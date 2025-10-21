import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, Users, DollarSign, Calendar, 
  Phone, Mail, CheckCircle, AlertCircle 
} from "lucide-react"
import { useCRMMetrics } from "@/hooks/useCRMMetrics"
import { CRMActivitiesTimeline } from "@/components/crm/CRMActivitiesTimeline"
import { CRMPerformanceChart } from "@/components/crm/CRMPerformanceChart"
import { TopLeadsWidget } from "@/components/crm/TopLeadsWidget"

export default function CRMDashboard() {
  const { metrics, loading } = useCRMMetrics()

  if (loading) {
    return <div className="p-6">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard CRM</h1>
        <p className="text-muted-foreground">Visão geral das suas atividades de vendas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
              <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              <p className="text-xs text-green-600">+{metrics.newLeadsThisMonth} este mês</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Total</p>
              <p className="text-2xl font-bold">
                R$ {(metrics.pipelineValue || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-green-600">
                {metrics.activeOpportunities} oportunidades
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              <p className="text-xs text-green-600">
                {metrics.wonDeals} negócios ganhos
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atividades Hoje</p>
              <p className="text-2xl font-bold">{metrics.activitiesToday}</p>
              <p className="text-xs text-orange-600">
                {metrics.overdueActivities} atrasadas
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance de Vendas</h3>
          <CRMPerformanceChart />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Leads</h3>
          <TopLeadsWidget />
        </Card>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">Atividades Recentes</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas Pendentes</TabsTrigger>
          <TabsTrigger value="calls">Chamadas Agendadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities" className="mt-6">
          <Card className="p-6">
            <CRMActivitiesTimeline />
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              {metrics.pendingTasks?.map((task: any) => (
                <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="calls" className="mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              {metrics.scheduledCalls?.map((call: any) => (
                <div key={call.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">{call.contact_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(call.scheduled_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ligar Agora
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
