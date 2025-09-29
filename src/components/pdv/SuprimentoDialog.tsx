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

interface SuprimentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caixaStatus: CaixaStatus | null
  onSuccess: () => void
}

export const SuprimentoDialog = ({ open, onOpenChange, caixaStatus, onSuccess }: SuprimentoDialogProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSuprimento = async () => {
    if (!valor || parseFloat(valor) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para o suprimento",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const valorSuprimento = parseFloat(valor)
      
      // Atualizar valor atual do caixa
      const { error: updateError } = await supabase
        .from('caixa_sessoes')
        .update({
          valor_atual: (caixaStatus?.valor_atual || 0) + valorSuprimento
        })
        .eq('id', caixaStatus?.id)

      if (updateError) throw updateError

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('caixa_movimentacoes')
        .insert({
          org_id: currentOrg?.id,
          sessao_id: caixaStatus?.id,
          tipo: 'suprimento',
          valor: valorSuprimento,
          descricao: descricao || 'Suprimento do caixa',
          created_by: user?.id
        })

      if (movError) throw movError

      toast({
        title: "Suprimento realizado!",
        description: `Valor adicionado: R$ ${valorSuprimento.toFixed(2)}`
      })

      setValor("")
      setDescricao("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding cash:', error)
      toast({
        title: "Erro ao realizar suprimento",
        description: "Ocorreu um erro ao adicionar dinheiro ao caixa",
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
          <DialogTitle>Suprimento do Caixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Valor atual no caixa:</p>
            <p className="font-semibold text-lg">R$ {caixaStatus?.valor_atual?.toFixed(2) || '0,00'}</p>
          </div>
          
          <div>
            <Label htmlFor="valor">Valor do Suprimento</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Motivo do suprimento..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
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
              onClick={handleSuprimento}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}