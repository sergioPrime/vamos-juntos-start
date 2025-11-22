import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { XCircle } from 'lucide-react'

interface NFeCancelDialogProps {
  open: boolean
  onClose: () => void
  nfeId: string
  nfeNumero: string
  orgId: string
  onSuccess: () => void
}

export function NFeCancelDialog({
  open,
  onClose,
  nfeId,
  nfeNumero,
  orgId,
  onSuccess
}: NFeCancelDialogProps) {
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (motivo.length < 15) {
      toast.error('O motivo deve ter no mínimo 15 caracteres')
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase.functions.invoke('cancel-nfe', {
        body: {
          nfe_id: nfeId,
          motivo,
          org_id: orgId
        }
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Erro ao cancelar NFe')
      }

      toast.success('NFe cancelada com sucesso!', {
        description: `Protocolo: ${data.protocolo}`
      })

      onSuccess()
      onClose()
      setMotivo('')

    } catch (error: any) {
      console.error('Erro ao cancelar NFe:', error)
      toast.error('Erro ao cancelar NFe', {
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancelar NFe #{nfeNumero}
          </DialogTitle>
          <DialogDescription>
            Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo do Cancelamento *
              <span className="text-xs text-muted-foreground ml-2">
                (mínimo 15 caracteres)
              </span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Digite o motivo do cancelamento da NFe..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length} caracteres
            </p>
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Atenção:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>O cancelamento só pode ser feito em até 24h após a autorização</li>
              <li>Após cancelada, a NFe não poderá ser revertida</li>
              <li>O motivo será registrado e enviado para a SEFAZ</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || motivo.length < 15}
          >
            {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
