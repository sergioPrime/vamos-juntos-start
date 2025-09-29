import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"

interface CaixaStatus {
  id: string
  status: string
  valor_inicial: number
  valor_atual: number
  abertura_em: string
}

interface FecharCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caixaStatus: CaixaStatus | null
  onSuccess: () => void
}

export const FecharCaixaDialog = ({ open, onOpenChange, caixaStatus, onSuccess }: FecharCaixaDialogProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [valorContado, setValorContado] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)

  const diferenca = valorContado ? parseFloat(valorContado) - (caixaStatus?.valor_atual || 0) : 0

  const handleFecharCaixa = async () => {
    if (!valorContado || parseFloat(valorContado) < 0) {
      toast({
        title: "Valor inválido",
        description: "Informe o valor contado no caixa",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Atualizar sessão do caixa
      const { error } = await supabase
        .from('caixa_sessoes')
        .update({
          status: 'fechado',
          valor_contado: parseFloat(valorContado),
          diferenca: diferenca,
          observacoes_fechamento: observacoes,
          fechamento_em: new Date().toISOString(),
          usuario_fechamento: user?.id
        })
        .eq('id', caixaStatus?.id)

      if (error) throw error

      // Registrar movimentação de fechamento
      await supabase
        .from('caixa_movimentacoes')
        .insert({
          org_id: currentOrg?.id,
          sessao_id: caixaStatus?.id,
          tipo: 'fechamento',
          valor: parseFloat(valorContado),
          descricao: `Fechamento do caixa${diferenca !== 0 ? ` - Diferença: R$ ${diferenca.toFixed(2)}` : ''}`,
          observacoes: observacoes,
          created_by: user?.id
        })

      toast({
        title: "Caixa fechado com sucesso!",
        description: `Valor contado: R$ ${parseFloat(valorContado).toFixed(2)}${diferenca !== 0 ? ` | Diferença: R$ ${diferenca.toFixed(2)}` : ''}`
      })

      setValorContado("")
      setObservacoes("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error closing cash:', error)
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro ao fechar o caixa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valor Sistema:</p>
              <p className="font-semibold">R$ {caixaStatus?.valor_atual?.toFixed(2) || '0,00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor Inicial:</p>
              <p className="font-semibold">R$ {caixaStatus?.valor_inicial?.toFixed(2) || '0,00'}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="valor-contado">Valor Contado no Caixa</Label>
            <Input
              id="valor-contado"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorContado}
              onChange={(e) => setValorContado(e.target.value)}
            />
          </div>
          
          {valorContado && diferenca !== 0 && (
            <div className={`p-3 rounded-md ${diferenca > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="font-medium">
                {diferenca > 0 ? 'Sobra' : 'Falta'}: R$ {Math.abs(diferenca).toFixed(2)}
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre o fechamento do caixa..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleFecharCaixa}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Fechando..." : "Fechar Caixa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}