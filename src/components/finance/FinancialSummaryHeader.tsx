import { TrendingDown, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FinancialEntry {
  entry_type: "receivable" | "payable"
  amount: number
  is_settled: boolean
  due_date: string
}

interface FinancialSummaryHeaderProps {
  entries: FinancialEntry[]
}

export function FinancialSummaryHeader({ entries }: FinancialSummaryHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const currentDate = new Date()
  
  // Contas a Pagar
  const payables = entries.filter(e => e.entry_type === 'payable')
  const payablesForecast = payables.reduce((sum, e) => sum + e.amount, 0)
  const payablesRealized = payables.filter(e => e.is_settled).reduce((sum, e) => sum + e.amount, 0)
  const payablesUnpaid = payables.filter(e => !e.is_settled).reduce((sum, e) => sum + e.amount, 0)
  
  // Contas a Receber
  const receivables = entries.filter(e => e.entry_type === 'receivable')
  const receivablesForecast = receivables.reduce((sum, e) => sum + e.amount, 0)
  const receivablesRealized = receivables.filter(e => e.is_settled).reduce((sum, e) => sum + e.amount, 0)
  const receivablesUnpaid = receivables.filter(e => !e.is_settled).reduce((sum, e) => sum + e.amount, 0)
  
  // Saldo
  const balanceForecast = receivablesForecast - payablesForecast
  const balanceRealized = receivablesRealized - payablesRealized
  const balanceUnpaid = receivablesUnpaid - payablesUnpaid

  const timestamp = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        {/* Contas a pagar */}
        <Card className="bg-red-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Contas a pagar</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Previsão do período</span>
                <span className="text-lg font-bold">{formatCurrency(payablesForecast)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Realizado período</span>
                <span className="text-lg font-bold">{formatCurrency(payablesRealized)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Não pago período</span>
                <span className="text-lg font-bold">{formatCurrency(payablesUnpaid)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contas a receber */}
        <Card className="bg-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Contas a receber</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Previsão do período</span>
                <span className="text-lg font-bold">{formatCurrency(receivablesForecast)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Realizado período</span>
                <span className="text-lg font-bold">{formatCurrency(receivablesRealized)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Não pago período</span>
                <span className="text-lg font-bold">{formatCurrency(receivablesUnpaid)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="bg-blue-400 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Saldo</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Previsão do período</span>
                <span className={cn("text-lg font-bold", balanceForecast < 0 && "text-red-200")}>
                  {formatCurrency(balanceForecast)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Realizado período</span>
                <span className={cn("text-lg font-bold", balanceRealized < 0 && "text-red-200")}>
                  {formatCurrency(balanceRealized)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Não pago período</span>
                <span className={cn("text-lg font-bold", balanceUnpaid < 0 && "text-red-200")}>
                  {formatCurrency(balanceUnpaid)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Totais atualizados em: {timestamp}
      </p>
    </div>
  )
}
