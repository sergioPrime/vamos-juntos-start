import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNFCe } from "@/hooks/useNFCe"

interface EmitirNFCeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderData: {
    total: number
    customer?: {
      name: string
      document?: string
    }
    items: any[]
  }
}

export const EmitirNFCeDialog = ({ open, onOpenChange, orderId, orderData }: EmitirNFCeDialogProps) => {
  const { toast } = useToast()
  const { emitNFCe, isLoading } = useNFCe()
  const [step, setStep] = useState<'confirm' | 'emitting' | 'success' | 'error'>('confirm')
  const [nfceData, setNfceData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState(orderData.customer?.document || '')

  const handleEmit = async () => {
    setStep('emitting')
    
    try {
      const result = await emitNFCe({
        orderId,
        customer: {
          nome: orderData.customer?.name || 'CONSUMIDOR',
          cpfCnpj: cpfCnpj || null,
        },
        items: orderData.items.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          ncm: item.ncm || '00000000',
          cfop: '5102',
          unit: item.unit || 'UN',
          quantity: item.quantity,
          unitValue: item.unit_price,
          totalValue: item.total_price,
        })),
        payment: {
          paymentMethod: '01', // Dinheiro
          value: orderData.total,
        }
      })

      if (result.success) {
        setNfceData(result.data)
        setStep('success')
        toast({
          title: "NFC-e emitida com sucesso!",
          description: `Número: ${result.data.numero} - Série: ${result.data.serie}`,
        })
      } else {
        setErrorMessage(result.error || 'Erro desconhecido')
        setStep('error')
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao emitir NFC-e')
      setStep('error')
      toast({
        title: "Erro ao emitir NFC-e",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setStep('confirm')
    setCpfCnpj('')
    setNfceData(null)
    setErrorMessage('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emitir NFC-e
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total da Venda:</span>
                <span className="font-bold">
                  {orderData.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Itens:</span>
                <span>{orderData.items.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ do Cliente (Opcional)</Label>
              <Input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={18}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para consumidor não identificado
              </p>
            </div>
          </div>
        )}

        {step === 'emitting' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Emitindo NFC-e...</p>
            <p className="text-sm text-muted-foreground">Aguarde a comunicação com a SEFAZ</p>
          </div>
        )}

        {step === 'success' && nfceData && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-green-600 mb-2">NFC-e Autorizada!</h3>
              <Badge className="bg-green-500">{nfceData.status}</Badge>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-mono font-bold">{nfceData.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Série:</span>
                <span className="font-mono">{nfceData.serie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chave de Acesso:</span>
                <span className="font-mono text-xs break-all">{nfceData.chave_acesso}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protocolo:</span>
                <span className="font-mono">{nfceData.protocolo_autorizacao}</span>
              </div>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-destructive mb-2">Erro na Emissão</h3>
              <Badge variant="destructive">Rejeitada</Badge>
            </div>
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleEmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir NFC-e
              </Button>
            </>
          )}

          {step === 'emitting' && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emitindo...
            </Button>
          )}

          {(step === 'success' || step === 'error') && (
            <>
              {step === 'success' && (
                <Button variant="outline" onClick={() => window.print()}>
                  Imprimir DANFE
                </Button>
              )}
              <Button onClick={handleClose}>
                {step === 'success' ? 'Concluir' : 'Tentar Novamente'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
