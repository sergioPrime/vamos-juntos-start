import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NFeCCeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: string
  nfeNumero: string
  chaveAcesso: string
  orgId: string
  onSuccess?: () => void
}

export function NFeCCeDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  orgId,
  onSuccess
}: NFeCCeDialogProps) {
  const [correcao, setCorrecao] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (correcao.length < 15) {
      toast.error('A correção deve ter no mínimo 15 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-cce', {
        body: { nfeId, correcao }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Carta de Correção enviada com sucesso')
        onSuccess?.()
        onOpenChange(false)
        setCorrecao("")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao enviar CC-e:', error)
      toast.error('Erro ao enviar Carta de Correção')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carta de Correção Eletrônica - NFe {nfeNumero}</DialogTitle>
          <DialogDescription>
            Descreva a correção a ser feita na NFe (mínimo 15 caracteres)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correcao">Descrição da Correção</Label>
              <Textarea
                id="correcao"
                placeholder="Ex: Correção do endereço de entrega, alteração de dados cadastrais..."
                value={correcao}
                onChange={(e) => setCorrecao(e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                {correcao.length}/1000 caracteres (mínimo 15)
              </p>
              <p className="text-xs text-yellow-600">
                Atenção: A CC-e não pode alterar valores, quantidade de produtos, dados fiscais ou CFOP.
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
              disabled={isLoading || correcao.length < 15}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar CC-e
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
