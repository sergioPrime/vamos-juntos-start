import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NFeCancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: string
  nfeNumero: string
  chaveAcesso: string
  orgId: string
  onSuccess?: () => void
}

export function NFeCancelDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  orgId,
  onSuccess
}: NFeCancelDialogProps) {
  const [justificativa, setJustificativa] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (justificativa.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-nfe', {
        body: { nfeId, justificativa }
      })

      if (error) throw error

      if (data.success) {
        toast.success('NFe cancelada com sucesso')
        onSuccess?.()
        onOpenChange(false)
        setJustificativa("")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao cancelar NFe:', error)
      toast.error('Erro ao cancelar NFe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar NFe {nfeNumero}</DialogTitle>
          <DialogDescription>
            Digite o motivo do cancelamento (mínimo 15 caracteres)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa do Cancelamento</Label>
              <Textarea
                id="justificativa"
                placeholder="Ex: Cancelamento a pedido do cliente devido erro no valor..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                {justificativa.length}/255 caracteres (mínimo 15)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isLoading || justificativa.length < 15}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
