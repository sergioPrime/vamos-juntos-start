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
import { FileText } from 'lucide-react'

interface NFeCCeDialogProps {
  open: boolean
  onClose: () => void
  nfeId: string
  nfeNumero: string
  orgId: string
  onSuccess: () => void
}

export function NFeCCeDialog({
  open,
  onClose,
  nfeId,
  nfeNumero,
  orgId,
  onSuccess
}: NFeCCeDialogProps) {
  const [correcao, setCorrecao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (correcao.length < 15) {
      toast.error('A correção deve ter no mínimo 15 caracteres')
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase.functions.invoke('send-cce', {
        body: {
          nfe_id: nfeId,
          correcao,
          org_id: orgId
        }
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar CC-e')
      }

      toast.success('Carta de Correção enviada com sucesso!', {
        description: `Protocolo: ${data.protocolo} | Sequência: ${data.sequencia}`
      })

      onSuccess()
      onClose()
      setCorrecao('')

    } catch (error: any) {
      console.error('Erro ao enviar CC-e:', error)
      toast.error('Erro ao enviar Carta de Correção', {
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Carta de Correção Eletrônica - NFe #{nfeNumero}
          </DialogTitle>
          <DialogDescription>
            Registre correções de erros que não alterem valores ou dados cadastrais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="correcao">
              Correção a ser registrada *
              <span className="text-xs text-muted-foreground ml-2">
                (mínimo 15 caracteres)
              </span>
            </Label>
            <Textarea
              id="correcao"
              placeholder="Descreva a correção a ser feita na NFe..."
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {correcao.length} caracteres
            </p>
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Limitações da CC-e:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Não pode corrigir valores, alíquotas, base de cálculo ou quantidade</li>
              <li>Não pode alterar dados cadastrais que mudem remetente ou destinatário</li>
              <li>Não pode corrigir data de emissão ou saída</li>
              <li>Limite de 20 CC-e por NFe</li>
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
            onClick={handleSubmit}
            disabled={isSubmitting || correcao.length < 15}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar CC-e'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
