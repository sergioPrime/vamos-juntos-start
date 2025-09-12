import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUpNumber } from "@/components/animations/CountUpNumber"
import { StaggeredList } from "@/components/animations/StaggeredList"

interface SummaryData {
  payables: {
    planned: number
    realized: number
  }
  receivables: {
    planned: number
    realized: number
  }
  balance: number
}

interface FinancialSummaryCardsProps {
  data: SummaryData
  loading?: boolean
}

export function FinancialSummaryCards({ data, loading = false }: FinancialSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getSummaryCards = () => [
    {
      title: "Contas a Pagar",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      values: [
        {
          label: "Previsto do período",
          value: data.payables.planned,
          textColor: "text-red-700 dark:text-red-400"
        },
        {
          label: "Realizado período",
          value: data.payables.realized,
          textColor: "text-red-900 dark:text-red-300"
        },
        {
          label: "Não pago período",
          value: data.payables.planned - data.payables.realized,
          textColor: "text-red-600 dark:text-red-500"
        }
      ]
    },
    {
      title: "Contas a Receber",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      values: [
        {
          label: "Previsto do período",
          value: data.receivables.planned,
          textColor: "text-green-700 dark:text-green-400"
        },
        {
          label: "Realizado período",
          value: data.receivables.realized,
          textColor: "text-green-900 dark:text-green-300"
        },
        {
          label: "Não pago período",
          value: data.receivables.planned - data.receivables.realized,
          textColor: "text-green-600 dark:text-green-500"
        }
      ]
    },
    {
      title: "Saldo",
      icon: DollarSign,
      color: data.balance >= 0 ? "text-blue-600" : "text-orange-600",
      bgColor: data.balance >= 0 ? "bg-blue-50 dark:bg-blue-950/20" : "bg-orange-50 dark:bg-orange-950/20",
      borderColor: data.balance >= 0 ? "border-blue-200 dark:border-blue-800" : "border-orange-200 dark:border-orange-800",
      values: [
        {
          label: "Saldo Atual",
          value: data.balance,
          textColor: data.balance >= 0 ? "text-blue-700 dark:text-blue-400" : "text-orange-700 dark:text-orange-400"
        }
      ]
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-5 w-5 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-32"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-24"></div>
                <div className="h-6 bg-muted rounded w-28"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-4" delay={150}>
      {getSummaryCards().map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={`border-l-4 ${card.borderColor} ${card.bgColor} transition-all duration-200 hover:shadow-md`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {card.values.map((item, valueIndex) => (
                <div key={valueIndex} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-semibold ${item.textColor}`}>
                    <CountUpNumber 
                      value={item.value} 
                      format="currency"
                      duration={1000 + (index * 200)}
                    />
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </StaggeredList>
  )
}