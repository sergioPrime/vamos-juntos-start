import { TrendingDown, TrendingUp, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FinancialSummaryHeaderProps {
  payables: {
    forecasted: number
    realized: number
    unpaid: number
  }
  receivables: {
    forecasted: number
    realized: number
    unpaid: number
  }
}

export function FinancialSummaryHeader({ payables, receivables }: FinancialSummaryHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const balance = {
    forecasted: receivables.forecasted - payables.forecasted,
    realized: receivables.realized - payables.realized,
    unpaid: receivables.unpaid - payables.unpaid
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Contas a Pagar */}
      <Card className="bg-red-500 text-white border-none overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Contas a pagar
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Previsão do período</span>
              <span className="font-bold">{formatCurrency(payables.forecasted)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Realizado período</span>
              <span className="font-bold">{formatCurrency(payables.realized)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Não pago período</span>
              <span className="font-bold">{formatCurrency(payables.unpaid)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Contas a Receber */}
      <Card className="bg-blue-600 text-white border-none overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Contas a receber
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Previsão do período</span>
              <span className="font-bold text-green-300">{formatCurrency(receivables.forecasted)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Realizado período</span>
              <span className="font-bold text-green-300">{formatCurrency(receivables.realized)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Não pago período</span>
              <span className="font-bold text-green-300">{formatCurrency(receivables.unpaid)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Saldo */}
      <Card className="bg-blue-400 text-white border-none overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Saldo
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Previsão do período</span>
              <span className={cn(
                "font-bold",
                balance.forecasted < 0 && "text-red-300"
              )}>
                {formatCurrency(balance.forecasted)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Realizado período</span>
              <span className={cn(
                "font-bold",
                balance.realized < 0 && "text-red-300"
              )}>
                {formatCurrency(balance.realized)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">Não pago período</span>
              <span className={cn(
                "font-bold",
                balance.unpaid < 0 && "text-red-300"
              )}>
                {formatCurrency(balance.unpaid)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
