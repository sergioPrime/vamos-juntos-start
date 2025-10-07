import { useState, useEffect } from "react"
import { CreditCard, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PaymentMethod {
  id: string
  name: string
  type: string
}

interface PaymentSplit {
  id: string
  paymentMethodId: string
  amount: number
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  paymentMethods: PaymentMethod[]
  onConfirm: (payments: PaymentSplit[], receivedAmount: number) => void
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  totalAmount,
  paymentMethods,
  onConfirm
}: PaymentDialogProps) => {
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: '1', paymentMethodId: '', amount: totalAmount }
  ])
  const [receivedAmount, setReceivedAmount] = useState(totalAmount)

  useEffect(() => {
    if (open) {
      // Reset on open
      setPayments([{ id: '1', paymentMethodId: '', amount: totalAmount }])
      setReceivedAmount(totalAmount)
    }
  }, [open, totalAmount])

  const addPaymentSplit = () => {
    const remainingAmount = totalAmount - paidAmount
    setPayments([
      ...payments,
      { id: Date.now().toString(), paymentMethodId: '', amount: remainingAmount > 0 ? remainingAmount : 0 }
    ])
  }

  const removePaymentSplit = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id))
    }
  }

  const updatePayment = (id: string, field: 'paymentMethodId' | 'amount', value: string | number) => {
    setPayments(payments.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const changeAmount = receivedAmount - totalAmount
  const remainingAmount = totalAmount - paidAmount

  const isValid = payments.every(p => p.paymentMethodId && p.amount > 0) &&
                  Math.abs(remainingAmount) < 0.01

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(payments, receivedAmount)
    }
  }

  const getPaymentMethodName = (id: string) => {
    const method = paymentMethods.find(pm => pm.id === id)
    return method?.name || ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Pagamento (Ctrl + Enter)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-accent/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total da Venda</div>
              <div className="text-2xl font-bold">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Pago</div>
              <div className={`text-2xl font-bold ${paidAmount >= totalAmount ? 'text-green-600' : 'text-orange-600'}`}>
                {paidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {remainingAmount > 0 ? 'Falta' : 'Troco'}
              </div>
              <div className={`text-2xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(remainingAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Splits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Formas de Pagamento</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaymentSplit}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Forma
              </Button>
            </div>

            {payments.map((payment, index) => (
              <div key={payment.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Forma de Pagamento {index + 1}</Label>
                  <Select
                    value={payment.paymentMethodId}
                    onValueChange={(value) => updatePayment(payment.id, 'paymentMethodId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(pm => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="text-right font-mono"
                  />
                </div>

                {payments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePaymentSplit(payment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Cash payment - show received amount and change */}
          {payments.some(p => {
            const pm = paymentMethods.find(pm => pm.id === p.paymentMethodId)
            return pm?.type === 'dinheiro' || pm?.name.toLowerCase().includes('dinheiro')
          }) && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-3">
              <Label>Valor Recebido em Dinheiro</Label>
              <Input
                type="number"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                className="text-right font-mono text-lg"
              />
              {changeAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Troco:</span>
                  <Badge variant="secondary" className="text-lg">
                    {changeAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar (ESC)
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
