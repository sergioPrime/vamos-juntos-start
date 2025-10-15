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

// Interface para dados do cartão
interface CardDetails {
  selectedCard: string
  amount: number
  cvNsu: string
  installments: number
  acquirer: string
  terminal: string
}

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

// Bandeiras de cartão disponíveis
const cardBrands = [
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'MasterCard' },
  { id: 'amex', name: 'American Exp.' },
  { id: 'sorocred', name: 'Sorocred' },
  { id: 'diners', name: 'Diners Club' },
  { id: 'elo', name: 'Elo' },
  { id: 'hipercard', name: 'Hipercard' },
  { id: 'aura', name: 'Aura' },
  { id: 'cabal', name: 'Cabal' },
  { id: 'alelo', name: 'Alelo' },
  { id: 'banescard', name: 'Banes Card' },
  { id: 'calcard', name: 'CalCard' },
  { id: 'credz', name: 'Credz' },
  { id: 'discover', name: 'Discover' },
  { id: 'goodcard', name: 'Good Card' },
  { id: 'greencard', name: 'Green Card' },
  { id: 'hiper', name: 'Hiper' },
  { id: 'jcb', name: 'JcB' },
  { id: 'mais', name: 'Mais!' },
  { id: 'maxvan', name: 'MaxVan' },
  { id: 'policard', name: 'PoliCard' },
  { id: 'redecompras', name: 'RedeCompras' },
  { id: 'sodexo', name: 'Sodexo' },
  { id: 'valecard', name: 'ValeCard' },
  { id: 'verocheque', name: 'Verocheque' },
  { id: 'vr', name: 'VR' },
  { id: 'ticket', name: 'Ticket' },
  { id: 'banrisul', name: 'Banrisul' },
  { id: 'outros', name: 'Outros' }
]

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
  const [selectedMethodType, setSelectedMethodType] = useState<string>('')
  
  // Estado para detalhes do cartão
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    selectedCard: '',
    amount: totalAmount,
    cvNsu: '',
    installments: 1,
    acquirer: '',
    terminal: ''
  })

  useEffect(() => {
    if (open) {
      // Reset on open
      setStep('select')
      setPayments([{ id: '1', paymentMethodId: '', amount: totalAmount }])
      setReceivedAmount(totalAmount)
      setSelectedMethodType('')
      setCardDetails({
        selectedCard: '',
        amount: totalAmount,
        cvNsu: '',
        installments: 1,
        acquirer: '',
        terminal: ''
      })
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
    const method = paymentMethods.find(pm => pm.id === methodId)
    const methodType = method?.name.toLowerCase() || ''
    
    setPayments([{ id: '1', paymentMethodId: methodId, amount: totalAmount }])
    setSelectedMethodType(methodType)
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
        <DialogContent className="max-w-[1100px] max-h-[90vh] bg-white dark:bg-gray-900">
          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-black dark:text-white mb-3" style={{ fontSize: '28px' }}>
                Selecione a Forma de Pagamento
              </h2>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300" style={{ fontSize: '20px' }}>
                Valor da Venda: {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {paymentMethods.map((method) => {
                const style = getPaymentMethodStyle(method.name)
                const Icon = style.icon
                
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="relative rounded-lg p-5 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-90 hover:shadow-xl"
                    style={{ 
                      backgroundColor: style.color,
                      aspectRatio: '1',
                      minHeight: '140px'
                    }}
                  >
                    {style.shortcut && (
                      <div className="absolute top-3 right-3 bg-white/30 px-3 py-1 rounded text-white font-bold" style={{ fontSize: '14px' }}>
                        {style.shortcut}
                      </div>
                    )}
                    <Icon className="text-white" size={64} strokeWidth={2.5} />
                    <span className="text-white font-bold text-center leading-tight" style={{ fontSize: '15px' }}>
                      {method.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Navigation indicators on the right side - positioned absolutely */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>Nova Venda</span>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-black dark:text-white" style={{ fontSize: '13px' }}>Forma de Pagamento</span>
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white border-2 border-black dark:border-white">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white dark:bg-black"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>Finalizar Venda</span>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-start mt-8">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#d9534f] hover:bg-[#c9302c] text-white border-0 shadow-sm rounded"
                style={{ fontSize: '16px', fontWeight: 600, padding: '12px 32px' }}
              >
                F12 - Voltar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Verificar se é cartão de crédito ou débito
  const isCardPayment = selectedMethodType.includes('crédito') || selectedMethodType.includes('débito')

  // Handler para seleção de bandeira
  const handleCardBrandSelect = (brandId: string) => {
    const brand = cardBrands.find(b => b.id === brandId)
    setCardDetails({
      ...cardDetails,
      selectedCard: brandId,
      acquirer: brandId === 'outros' ? '' : brand?.name || ''
    })
  }

  // Handler para confirmar pagamento com cartão
  const handleCardPaymentConfirm = () => {
    if (cardDetails.selectedCard && cardDetails.amount > 0) {
      onConfirm(payments, receivedAmount)
    }
  }

  // Renderizar tela de detalhes do cartão
  if (step === 'details' && isCardPayment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedMethodType.includes('crédito') ? 'Cartão de Crédito' : 'Cartão de Débito'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Grid de Bandeiras */}
            <div className="grid grid-cols-6 gap-3 max-md:grid-cols-3 max-sm:grid-cols-2">
              {cardBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleCardBrandSelect(brand.id)}
                  role="button"
                  aria-pressed={cardDetails.selectedCard === brand.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border transition-all",
                    "hover:shadow-md hover:border-blue-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    cardDetails.selectedCard === brand.id
                      ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500 shadow-lg ring-2 ring-blue-200"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  )}
                  style={{ aspectRatio: '1', minHeight: '80px' }}
                >
                  <div className="w-12 h-12 mb-2 flex items-center justify-center">
                    <CreditCard className={cn(
                      "w-10 h-10",
                      cardDetails.selectedCard === brand.id ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center",
                    cardDetails.selectedCard === brand.id ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {brand.name}
                  </span>
                </button>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Campos de Entrada */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor" className="text-sm font-medium">Valor</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardDetails.amount}
                    onChange={(e) => setCardDetails({ ...cardDetails, amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 text-right font-mono text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="cvnsu" className="text-sm font-medium">CV / NSU</Label>
                  <Input
                    id="cvnsu"
                    type="text"
                    value={cardDetails.cvNsu}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvNsu: e.target.value })}
                    placeholder="______"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parcelas" className="text-sm font-medium">N° Parcelas</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min="1"
                    value={cardDetails.installments}
                    onChange={(e) => setCardDetails({ ...cardDetails, installments: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="credenciadora" className="text-sm font-medium">Credenciadora</Label>
                  {cardDetails.selectedCard === 'outros' ? (
                    <Input
                      id="credenciadora"
                      type="text"
                      value={cardDetails.acquirer}
                      onChange={(e) => setCardDetails({ ...cardDetails, acquirer: e.target.value })}
                      placeholder="Digite a credenciadora"
                      className="mt-1"
                    />
                  ) : (
                    <Select
                      value={cardDetails.acquirer}
                      onValueChange={(value) => setCardDetails({ ...cardDetails, acquirer: value })}
                    >
                      <SelectTrigger id="credenciadora" className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardDetails.selectedCard && (
                          <SelectItem value={cardDetails.acquirer || cardDetails.selectedCard}>
                            {cardDetails.acquirer || cardBrands.find(b => b.id === cardDetails.selectedCard)?.name}
                          </SelectItem>
                        )}
                        <SelectItem value="cielo">Cielo</SelectItem>
                        <SelectItem value="rede">Rede</SelectItem>
                        <SelectItem value="stone">Stone</SelectItem>
                        <SelectItem value="getnet">Getnet</SelectItem>
                        <SelectItem value="pagseguro">PagSeguro</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="terminal" className="text-sm font-medium">Terminal</Label>
                  <Input
                    id="terminal"
                    type="text"
                    value={cardDetails.terminal}
                    onChange={(e) => setCardDetails({ ...cardDetails, terminal: e.target.value })}
                    placeholder="_________"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleCardPaymentConfirm}
                disabled={!cardDetails.selectedCard || cardDetails.amount <= 0}
                className="w-[200px] bg-green-600 hover:bg-green-700 text-white font-semibold text-base py-6"
              >
                F8 - Salvar
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setStep('select')}>
              Voltar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar (ESC)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Renderizar tela de detalhes do pagamento (outras formas)
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