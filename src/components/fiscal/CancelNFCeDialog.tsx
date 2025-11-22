import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, XCircle, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNFCe } from "@/hooks/useNFCe"
import { differenceInHours } from "date-fns"

interface CancelNFCeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfce: {
    id: string
    numero: number
    serie: string
    data_emissao: string
    valor_total: number
    status: string
  }
  onSuccess?: () => void
}

export const CancelNFCeDialog = ({ open, onOpenChange, nfce, onSuccess }: CancelNFCeDialogProps) => {
  const { toast } = useToast()
  const { cancelNFCe, isLoading } = useNFCe()
  const [justification, setJustification] = useState('')
  const [step, setStep] = useState<'confirm' | 'canceling' | 'success' | 'error'>('confirm')
  const [errorMessage, setErrorMessage] = useState('')

  // Verificar se está dentro do prazo (24h)
  const emissionDate = new Date(nfce.data_emissao)
  const now = new Date()
  const hoursSinceEmission = differenceInHours(now, emissionDate)
  const isWithinDeadline = hoursSinceEmission <= 24

  const handleCancel = async () => {
    if (!justification.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Informe o motivo do cancelamento.",
        variant: "destructive",
      })
      return
    }

    if (justification.trim().length < 15) {
      toast({
        title: "Justificativa muito curta",
        description: "A justificativa deve ter no mínimo 15 caracteres.",
        variant: "destructive",
      })
      return
    }

    setStep('canceling')
    
    try {
      const result = await cancelNFCe({
        nfceId: nfce.id,
        justification: justification.trim(),
      })

      if (result.success) {
        setStep('success')
        toast({
          title: "NFC-e cancelada com sucesso!",
          description: `A NFC-e ${nfce.numero} foi cancelada.`,
        })
        onSuccess?.()
      } else {
        setErrorMessage(result.error || 'Erro desconhecido')
        setStep('error')
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao cancelar NFC-e')
      setStep('error')
      toast({
        title: "Erro ao cancelar NFC-e",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setStep('confirm')
    setJustification('')
    setErrorMessage('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancelar NFC-e
          </DialogTitle>
          <DialogDescription>
            NFC-e Nº {nfce.numero} / Série {nfce.serie}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Alerta de prazo */}
            {!isWithinDeadline && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção! Esta NFC-e foi emitida há mais de 24 horas. O cancelamento pode ser rejeitado pela SEFAZ.
                </AlertDescription>
              </Alert>
            )}

            {/* Informações da NFC-e */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Número:</span>
                <span className="font-mono font-bold">{nfce.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Série:</span>
                <span className="font-mono">{nfce.serie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="font-bold">
                  {nfce.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tempo desde emissão:</span>
                <span className={isWithinDeadline ? 'text-green-600' : 'text-red-600'}>
                  {hoursSinceEmission}h
                </span>
              </div>
            </div>

            {/* Campo de justificativa */}
            <div className="space-y-2">
              <Label htmlFor="justification">
                Justificativa do Cancelamento *
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)..."
                rows={4}
                maxLength={255}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {justification.length}/255 caracteres
              </p>
            </div>

            {/* Aviso importante */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> O cancelamento é irreversível. Após cancelada, a NFC-e não poderá ser utilizada e uma nova nota deverá ser emitida se necessário.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'canceling' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Cancelando NFC-e...</p>
            <p className="text-sm text-muted-foreground">Aguarde a comunicação com a SEFAZ</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-green-600 mb-2">Cancelamento Autorizado!</h3>
              <p className="text-sm text-muted-foreground">
                A NFC-e {nfce.numero} foi cancelada com sucesso pela SEFAZ.
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-destructive mb-2">Erro no Cancelamento</h3>
            </div>
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading || !justification.trim() || justification.trim().length < 15}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancelar NFC-e
              </Button>
            </>
          )}

          {step === 'canceling' && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cancelando...
            </Button>
          )}

          {(step === 'success' || step === 'error') && (
            <Button onClick={handleClose} className="w-full">
              {step === 'success' ? 'Concluir' : 'Fechar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
