import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { 
  DollarSign, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  ClipboardList,
  Package,
  Warehouse,
  Users,
  Box,
  Settings,
  Building2,
  CreditCard,
  TrendingUp
} from "lucide-react"

interface QuickAccessModule {
  title: string
  description: string
  icon: React.ReactNode
  route: string
  color: string
}

export function QuickAccessCards() {
  const navigate = useNavigate()

  const modules: QuickAccessModule[] = [
    {
      title: "Lançamentos Financeiros",
      description: "Gerencie receitas e despesas",
      icon: <DollarSign className="h-6 w-6" />,
      route: "/finance/lancamentos",
      color: "bg-green-500/10 text-green-600 dark:text-green-400"
    },
    {
      title: "Boletos",
      description: "Emissão e controle de boletos",
      icon: <FileText className="h-6 w-6" />,
      route: "/finance/boletos",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      title: "PDV",
      description: "Ponto de venda rápido",
      icon: <ShoppingCart className="h-6 w-6" />,
      route: "/pdv",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Operações do PDV",
      description: "Gestão de caixa e movimentos",
      icon: <Receipt className="h-6 w-6" />,
      route: "/pdv/operacoes",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Pedidos e Orçamentos",
      description: "Gerencie vendas e propostas",
      icon: <ClipboardList className="h-6 w-6" />,
      route: "/orders-quotes",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    },
    {
      title: "Solicitações de Compra",
      description: "Requisições e aprovações",
      icon: <TrendingUp className="h-6 w-6" />,
      route: "/purchases/requests",
      color: "bg-red-500/10 text-red-600 dark:text-red-400"
    },
    {
      title: "Gestão de Estoque",
      description: "Controle de inventário",
      icon: <Warehouse className="h-6 w-6" />,
      route: "/inventory",
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400"
    },
    {
      title: "Pessoas",
      description: "Clientes e fornecedores",
      icon: <Users className="h-6 w-6" />,
      route: "/cadastros/pessoas",
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400"
    },
    {
      title: "Produtos",
      description: "Cadastro de produtos",
      icon: <Box className="h-6 w-6" />,
      route: "/products",
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Configurações do ERP",
      description: "Configurações gerais",
      icon: <Settings className="h-6 w-6" />,
      route: "/settings/erp-config",
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    },
    {
      title: "Empresas",
      description: "Cadastro de empresas",
      icon: <Building2 className="h-6 w-6" />,
      route: "/settings/companies",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Renovar Licença",
      description: "Gerenciar assinatura",
      icon: <CreditCard className="h-6 w-6" />,
      route: "/settings/renovar-licenca",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((module) => (
        <Card 
          key={module.route}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
          onClick={() => navigate(module.route)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${module.color} group-hover:scale-110 transition-transform`}>
                {module.icon}
              </div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {module.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
