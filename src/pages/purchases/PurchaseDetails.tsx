import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  ordered: 'Pedido Feito',
  received: 'Recebido',
  cancelled: 'Cancelado',
}

const paymentStatusLabels = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
}

export default function PurchaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrg } = useOrganization()
  
  const [purchase, setPurchase] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && currentOrg?.id) {
      fetchPurchase()
    }
  }, [id, currentOrg])

  const fetchPurchase = async () => {
    try {
      setLoading(true)
      
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .single()

      if (purchaseError) throw purchaseError

      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id)

      if (itemsError) throw itemsError

      setPurchase(purchaseData)
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching purchase:', error)
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        const { error } = await supabase
          .from('purchases')
          .delete()
          .eq('id', id)

        if (error) throw error

        toast.success('Pedido excluído com sucesso!')
        navigate('/purchases')
      } catch (error) {
        toast.error('Erro ao excluir pedido')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Pedido não encontrado</p>
            <Button onClick={() => navigate('/purchases')} className="mt-4">
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            Pedido {purchase.purchase_number}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/purchases/edit/${id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-medium">{purchase.purchase_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data do Pedido</p>
              <p className="font-medium">
                {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
              </p>
            </div>
            {purchase.expected_delivery_date && (
              <div>
                <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                <p className="font-medium">
                  {format(new Date(purchase.expected_delivery_date), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status do Pedido</p>
              <Badge className="mt-1">
                {statusLabels[purchase.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status do Pagamento</p>
              <Badge className="mt-1">
                {paymentStatusLabels[purchase.payment_status as keyof typeof paymentStatusLabels]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-medium">R$ {purchase.subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">R$ {purchase.total_amount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {purchase.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product_name || 'Produto'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {item.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Total:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  R$ {items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
