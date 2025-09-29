import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"

interface AbrirCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const AbrirCaixaDialog = ({ open, onOpenChange, onSuccess }: AbrirCaixaDialogProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [valorInicial, setValorInicial] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAbrirCaixa = async () => {
    if (!valorInicial || parseFloat(valorInicial) < 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor inicial válido",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('caixa_sessoes')
        .insert({
          org_id: currentOrg?.id,
          usuario_abertura: user?.id,
          valor_inicial: parseFloat(valorInicial),
          valor_atual: parseFloat(valorInicial),
          status: 'aberto',
          abertura_em: new Date().toISOString()
        })

      if (error) throw error

      // Registrar movimentação
      await supabase
        .from('caixa_movimentacoes')
        .insert({
          org_id: currentOrg?.id,
          tipo: 'abertura',
          valor: parseFloat(valorInicial),
          descricao: 'Abertura do caixa',
          created_by: user?.id
        })

      toast({
        title: "Caixa aberto com sucesso!",
        description: `Valor inicial: R$ ${parseFloat(valorInicial).toFixed(2)}`
      })

      setValorInicial("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error opening cash:', error)
      toast({
        title: "Erro ao abrir caixa",
        description: "Ocorreu um erro ao abrir o caixa",
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
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="valor-inicial">Valor Inicial do Caixa</Label>
            <Input
              id="valor-inicial"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
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
              onClick={handleAbrirCaixa}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}