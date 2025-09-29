import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"

interface Order {
  id: string
  order_number: string
  total_amount: number
  created_at: string
}

interface DevolucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const DevolucaoDialog = ({ open, onOpenChange, onSuccess }: DevolucaoDialogProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState("")
  const [motivo, setMotivo] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (open) {
      loadRecentOrders()
    }
  }, [open, currentOrg])

  const loadRecentOrders = async () => {
    setLoadingOrders(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, created_at')
        .eq('org_id', currentOrg?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos recentes",
        variant: "destructive"
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleDevolucao = async () => {
    if (!selectedOrder) {
      toast({
        title: "Pedido obrigatório",
        description: "Selecione o pedido para devolução",
        variant: "destructive"
      })
      return
    }

    if (!motivo.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da devolução",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const order = orders.find(o => o.id === selectedOrder)
      if (!order) throw new Error('Pedido não encontrado')

      // Buscar itens do pedido para devolver ao estoque
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', selectedOrder)

      if (itemsError) throw itemsError

      // Criar movimentações de estoque para cada item
      for (const item of orderItems || []) {
        await supabase
          .from('stock_movements')
          .insert({
            org_id: currentOrg?.id,
            product_id: item.product_id,
            movement_type: 'in',
            quantity: item.quantity,
            reference_type: 'devolucao',
            reference_id: selectedOrder,
            notes: `Devolução - ${order.order_number}: ${motivo}`,
            created_by: user?.id
          })
      }

      // Atualizar status do pedido
      await supabase
        .from('orders')
        .update({
          status: 'returned',
          notes: `Devolução: ${motivo}`
        })
        .eq('id', selectedOrder)

      // Registrar movimentação do caixa (se houver caixa aberto)
      const { data: caixaAberto } = await supabase
        .from('caixa_sessoes')
        .select('id, valor_atual')
        .eq('org_id', currentOrg?.id)
        .eq('status', 'aberto')
        .maybeSingle()

      if (caixaAberto) {
        // Atualizar valor do caixa
        await supabase
          .from('caixa_sessoes')
          .update({
            valor_atual: caixaAberto.valor_atual - order.total_amount
          })
          .eq('id', caixaAberto.id)

        // Registrar movimentação
        await supabase
          .from('caixa_movimentacoes')
          .insert({
            org_id: currentOrg?.id,
            sessao_id: caixaAberto.id,
            tipo: 'devolucao',
            valor: order.total_amount,
            descricao: `Devolução - ${order.order_number}`,
            observacoes: motivo,
            reference_id: selectedOrder,
            reference_type: 'order',
            created_by: user?.id
          })
      }

      toast({
        title: "Devolução processada!",
        description: `Pedido ${order.order_number} devolvido com sucesso`
      })

      setSelectedOrder("")
      setMotivo("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error processing return:', error)
      toast({
        title: "Erro ao processar devolução",
        description: "Ocorreu um erro ao processar a devolução",
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
          <DialogTitle>Devolução de Produtos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pedido">Pedido para Devolução</Label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder} disabled={loadingOrders}>
              <SelectTrigger>
                <SelectValue placeholder={loadingOrders ? "Carregando..." : "Selecione o pedido"} />
              </SelectTrigger>
              <SelectContent>
                {orders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - R$ {order.total_amount.toFixed(2)} - {new Date(order.created_at).toLocaleString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="motivo">Motivo da Devolução</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da devolução..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
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
              onClick={handleDevolucao}
              disabled={loading || !selectedOrder || !motivo.trim()}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Processando..." : "Processar Devolução"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}