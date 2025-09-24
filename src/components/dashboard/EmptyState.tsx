import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Package, Users, DollarSign, FileText, ArrowRight } from "lucide-react"

export function EmptyState() {
  const navigate = useNavigate()

  const quickActions = [
    {
      title: "Cadastrar primeiro produto",
      description: "Comece adicionando produtos ao seu catálogo",
      icon: <Package className="h-6 w-6" />,
      action: () => navigate('/products'),
      color: "bg-blue-500"
    },
    {
      title: "Adicionar clientes",
      description: "Cadastre seus clientes para começar a vender",
      icon: <Users className="h-6 w-6" />,
      action: () => navigate('/cadastros/pessoas'),
      color: "bg-green-500"
    },
    {
      title: "Fazer primeira venda",
      description: "Use o PDV para registrar uma venda",
      icon: <DollarSign className="h-6 w-6" />,
      action: () => navigate('/pdv'),
      color: "bg-purple-500"
    },
    {
      title: "Configurar financeiro",
      description: "Configure contas e lançamentos",
      icon: <FileText className="h-6 w-6" />,
      action: () => navigate('/finance/lancamentos'),
      color: "bg-orange-500"
    }
  ]

  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-8">
        <div>
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold mb-2">Vamos começar!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seu sistema está pronto. Escolha uma das opções abaixo para dar os primeiros passos 
            e começar a aproveitar todo o potencial do Prime ERP.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-6 flex items-center space-x-4 hover:shadow-lg transition-all"
              onClick={action.action}
            >
              <div className={`p-3 rounded-lg text-white ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{action.title}</div>
                <div className="text-sm text-muted-foreground">{action.description}</div>
              </div>
              <ArrowRight className="h-5 w-5 opacity-50" />
            </Button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          💡 <strong>Dica:</strong> Comece pelos produtos e clientes - assim você terá tudo pronto para suas primeiras vendas!
        </div>
      </CardContent>
    </Card>
  )
}