import { useState, useEffect } from "react"
import { CreditCard, Plus, Trash2, Banknote, FileText, Gift, ShoppingCart, Fuel, PiggyBank, DollarSign, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

// Mapeamento de ícones e cores por tipo de pagamento
const getPaymentMethodStyle = (name: string) => {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('dinheiro')) {
    return { 
      icon: Banknote, 
      color: '#5cb85c',
      label: 'Dinheiro',
      shortcut: 'F1'
    }
  }
  if (nameLower.includes('cheque')) {
    return { 
      icon: FileText, 
      color: '#f0ad4e',
      label: 'Cheque',
      shortcut: 'F2'
    }
  }
  if (nameLower.includes('crédito') && !nameLower.includes('loja') && !nameLower.includes('vale')) {
    return { 
      icon: CreditCard, 
      color: '#d9534f',
      label: 'Cartão Crédito',
      shortcut: 'F3'
    }
  }
  if (nameLower.includes('débito')) {
    return { 
      icon: CreditCard, 
      color: '#5bc0de',
      label: 'Cartão Débito',
      shortcut: 'F4'
    }
  }
  if (nameLower.includes('crédito') && nameLower.includes('loja')) {
    return { 
      icon: ShoppingCart, 
      color: '#e91e63',
      label: 'Crédito Loja',
      shortcut: 'F5'
    }
  }
  if (nameLower.includes('vale') && nameLower.includes('alimentação')) {
    return { 
      icon: ShoppingCart, 
      color: '#2e7d32',
      label: 'Vale Alimentação',
      shortcut: 'F6'
    }
  }
  if (nameLower.includes('vale') && nameLower.includes('refeição')) {
    return { 
      icon: Gift, 
      color: '#ff6f00',
      label: 'Vale Refeição',
      shortcut: 'F7'
    }
  }
  if (nameLower.includes('vale') && nameLower.includes('presente')) {
    return { 
      icon: Gift, 
      color: '#e91e63',
      label: 'Vale Presente',
      shortcut: 'F8'
    }
  }
  if (nameLower.includes('pix')) {
    return { 
      icon: Smartphone, 
      color: '#00bcd4',
      label: 'PIX',
      shortcut: 'F9'
    }
  }
  if (nameLower.includes('vale') && nameLower.includes('crédito')) {
    return { 
      icon: CreditCard, 
      color: '#03a9f4',
      label: 'Vale Crédito',
      shortcut: 'F10'
    }
  }
  if (nameLower.includes('combustível')) {
    return { 
      icon: Fuel, 
      color: '#f44336',
      label: 'Vale Combustível',
      shortcut: ''
    }
  }
  
  return { 
    icon: PiggyBank, 
    color: '#9e9e9e',
    label: 'Outros',
    shortcut: ''
  }
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  totalAmount,
  paymentMethods,
  onConfirm
}: PaymentDialogProps) => {
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: '1', paymentMethodId: '', amount: totalAmount }
  ])
  const [receivedAmount, setReceivedAmount] = useState(totalAmount)

  useEffect(() => {
    if (open) {
      // Reset on open
      setStep('select')
      setPayments([{ id: '1', paymentMethodId: '', amount: totalAmount }])
      setReceivedAmount(totalAmount)
    }
  }, [open, totalAmount])

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || step !== 'select') return

    const handleKeyPress = (e: KeyboardEvent) => {
      // F1-F10 para formas de pagamento
      if (e.key >= 'F1' && e.key <= 'F10') {
        e.preventDefault()
        const shortcut = e.key
        const method = paymentMethods.find(pm => {
          const style = getPaymentMethodStyle(pm.name)
          return style.shortcut === shortcut
        })
        if (method) {
          handleMethodSelect(method.id)
        }
      }
      // F12 para voltar
      if (e.key === 'F12') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [open, step, paymentMethods])

  const handleMethodSelect = (methodId: string) => {
    setPayments([{ id: '1', paymentMethodId: methodId, amount: totalAmount }])
    setStep('details')
  }

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

  // Renderizar tela de seleção
  if (step === 'select') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <div className="space-y-6 p-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Selecione a Forma de Pagamento
              </h2>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Valor da Venda: {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-5 gap-4">
              {paymentMethods.map((method) => {
                const style = getPaymentMethodStyle(method.name)
                const Icon = style.icon
                
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="relative aspect-square rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: style.color }}
                  >
                    {style.shortcut && (
                      <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded text-white text-xs font-bold">
                        {style.shortcut}
                      </div>
                    )}
                    <Icon className="w-12 h-12 text-white" strokeWidth={2} />
                    <span className="text-white font-bold text-sm text-center">
                      {method.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Navigation indicators on the right side */}
            <div className="flex justify-end gap-2">
              <div className="flex flex-col gap-2 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Nova Venda</span>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm font-semibold text-black dark:text-white">Forma de Pagamento</span>
                  <div className="w-4 h-4 rounded-full bg-black dark:bg-white border-2 border-black dark:border-white"></div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Finalizar Venda</span>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-start">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-6 py-3 rounded-lg font-semibold"
              >
                F12 - Voltar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Renderizar tela de detalhes do pagamento
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
          <Button variant="outline" onClick={() => setStep('select')}>
            Voltar
          </Button>
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