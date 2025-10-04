import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface UserCommissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserCommissionDialog({ open, onOpenChange }: UserCommissionDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [diaVencimento, setDiaVencimento] = useState<string>('28')
  const [comissaoPorProdutoPDV, setComissaoPorProdutoPDV] = useState(false)
  const [comissaoPDV, setComissaoPDV] = useState<string>('0')
  const [comissaoPorProdutoPedidos, setComissaoPorProdutoPedidos] = useState(false)
  const [comissaoPedidos, setComissaoPedidos] = useState<string>('0')

  useEffect(() => {
    if (open && user?.id) {
      loadCommissionData()
    }
  }, [open, user?.id])

  const loadCommissionData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('dia_vencimento_comissoes_pdv, comissao_por_produto_pdv, comissao_pdv_percentual, comissao_por_produto_pedidos, comissao_pedidos_percentual')
        .eq('id', user!.id)
        .single()

      if (error) throw error

      if (data) {
        setDiaVencimento(data.dia_vencimento_comissoes_pdv?.toString() || '28')
        setComissaoPorProdutoPDV(data.comissao_por_produto_pdv || false)
        setComissaoPDV(data.comissao_pdv_percentual?.toString() || '0')
        setComissaoPorProdutoPedidos(data.comissao_por_produto_pedidos || false)
        setComissaoPedidos(data.comissao_pedidos_percentual?.toString() || '0')
      }
    } catch (error) {
      console.error('Erro ao carregar dados de comissão:', error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Validação
      const comissaoPDVNum = parseFloat(comissaoPDV)
      const comissaoPedidosNum = parseFloat(comissaoPedidos)

      if (!comissaoPorProdutoPDV && (comissaoPDVNum < 0 || comissaoPDVNum > 100)) {
        toast({
          title: "Erro de validação",
          description: "A comissão PDV deve estar entre 0 e 100%",
          variant: "destructive",
        })
        return
      }

      if (!comissaoPorProdutoPedidos && (comissaoPedidosNum < 0 || comissaoPedidosNum > 100)) {
        toast({
          title: "Erro de validação",
          description: "A comissão de Pedidos e Orçamentos deve estar entre 0 e 100%",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          dia_vencimento_comissoes_pdv: parseInt(diaVencimento),
          comissao_por_produto_pdv: comissaoPorProdutoPDV,
          comissao_pdv_percentual: comissaoPorProdutoPDV ? null : comissaoPDVNum,
          comissao_por_produto_pedidos: comissaoPorProdutoPedidos,
          comissao_pedidos_percentual: comissaoPorProdutoPedidos ? null : comissaoPedidosNum,
        })
        .eq('id', user!.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Configurações de comissão atualizadas com sucesso!",
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Configurações de Comissões</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configurações Gerais */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Configurações Gerais</h3>
            <div className="space-y-2">
              <Label>Dia Vencimento Comissões PDV</Label>
              <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Configurações PDV */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Configurações PDV</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="comissao-produto-pdv" className="cursor-pointer">
                  Comissão a partir do Produto (PDV)
                </Label>
                <Switch
                  id="comissao-produto-pdv"
                  checked={comissaoPorProdutoPDV}
                  onCheckedChange={setComissaoPorProdutoPDV}
                />
              </div>

              <div className="space-y-2">
                <Label>Comissão PDV (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={comissaoPDV}
                  onChange={(e) => setComissaoPDV(e.target.value)}
                  disabled={comissaoPorProdutoPDV}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Configurações Pedidos e Orçamentos */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Configurações Pedidos e Orçamentos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="comissao-produto-pedidos" className="cursor-pointer">
                  Comissão a partir do Produto (Pedidos e Orçamentos)
                </Label>
                <Switch
                  id="comissao-produto-pedidos"
                  checked={comissaoPorProdutoPedidos}
                  onCheckedChange={setComissaoPorProdutoPedidos}
                />
              </div>

              <div className="space-y-2">
                <Label>Comissão Pedidos e Orçamentos (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={comissaoPedidos}
                  onChange={(e) => setComissaoPedidos(e.target.value)}
                  disabled={comissaoPorProdutoPedidos}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
