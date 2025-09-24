import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useNavigate } from "react-router-dom"
import { 
  Sparkles, 
  RocketIcon, 
  CheckCircle, 
  ArrowRight,
  Package,
  Users,
  DollarSign,
  BarChart3
} from "lucide-react"

interface WelcomeCardProps {
  onDismiss?: () => void
}

export function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const navigate = useNavigate()

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário'

  const quickStartSteps = [
    {
      title: "Cadastrar produtos",
      description: "Adicione seus primeiros produtos ao sistema",
      icon: <Package className="h-4 w-4" />,
      action: () => navigate('/products'),
      completed: false
    },
    {
      title: "Adicionar clientes",
      description: "Cadastre seus clientes para vendas",
      icon: <Users className="h-4 w-4" />,
      action: () => navigate('/cadastros/pessoas'),
      completed: false
    },
    {
      title: "Primeira venda",
      description: "Registre sua primeira venda no PDV",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate('/pdv'),
      completed: false
    },
    {
      title: "Ver relatórios",
      description: "Explore os relatórios e métricas",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => navigate('/finance/reports'),
      completed: false
    }
  ]

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Bem-vindo ao Prime ERP, {firstName}!
                <Badge variant="secondary" className="text-xs">
                  <RocketIcon className="h-3 w-3 mr-1" />
                  Novo
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentOrg ? (
                  <>Organização: <span className="font-medium">{currentOrg.name}</span></>
                ) : (
                  "Vamos começar a configurar seu sistema"
                )}
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Primeiros Passos (Recomendado)
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {quickStartSteps.map((step, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-md transition-all"
                onClick={step.action}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-md text-primary">
                    {step.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Dica: Use a barra lateral para navegar entre os módulos. Começe pelos cadastros básicos!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}