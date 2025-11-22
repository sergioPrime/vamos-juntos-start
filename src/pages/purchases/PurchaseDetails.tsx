import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePurchases } from '@/hooks/usePurchases'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-blue-500/10 text-blue-500',
  received: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
}

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  received: 'Recebido',
  cancelled: 'Cancelado',
}

export default function PurchaseDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getPurchase, deletePurchase, changeStatus } = usePurchases()
  const [purchase, setPurchase] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPurchase = async () => {
      if (!id) return

      try {
        const data = await getPurchase(id)
        setPurchase(data.purchase)
        setItems(data.items || [])
      } catch (error) {
        console.error('Error loading purchase:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPurchase()
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    if (window.confirm('Deseja realmente excluir este pedido de compra?')) {
      await deletePurchase(id)
      navigate('/purchases')
    }
  }

  const handleApprove = async () => {
    if (!id) return
    await changeStatus({ purchaseId: id, status: 'approved' })
    window.location.reload()
  }

  const handleReceive = async () => {
    if (!id) return
    if (window.confirm('Confirmar recebimento deste pedido de compra?')) {
      await changeStatus({ purchaseId: id, status: 'received' })
      window.location.reload()
    }
  }

  const handleCancel = async () => {
    if (!id) return
    if (window.confirm('Deseja realmente cancelar este pedido de compra?')) {
      await changeStatus({ purchaseId: id, status: 'cancelled' })
      window.location.reload()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="container mx-auto p-6">
        <p>Pedido não encontrado</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/purchases')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Pedido #{purchase.purchase_number}
            </h1>
            <p className="text-muted-foreground">
              Detalhes do pedido de compra
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {purchase.status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={handleApprove}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/purchases/${id}/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
          {purchase.status === 'approved' && (
            <Button onClick={handleReceive} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmar Recebimento
            </Button>
          )}
          {(purchase.status === 'pending' || purchase.status === 'approved') && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Informações do Pedido</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-medium">{purchase.purchase_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">
                {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="secondary"
                className={statusColors[purchase.status as keyof typeof statusColors] || ''}
              >
                {statusLabels[purchase.status as keyof typeof statusLabels] || purchase.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagamento</p>
              <Badge variant="outline">
                {purchase.payment_status === 'paid' && 'Pago'}
                {purchase.payment_status === 'pending' && 'Pendente'}
                {purchase.payment_status === 'partial' && 'Parcial'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Fornecedor</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">
                {purchase.supplier?.nome_razao_social || 'Sem fornecedor'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Valores</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-medium">
                R$ {purchase.subtotal.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">
                R$ {purchase.total_amount.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {purchase.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Observações</h3>
          <p className="text-muted-foreground">{purchase.notes}</p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Itens do Pedido</h3>
        <div className="rounded-md border">
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
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {item.unit_price.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {item.total_price.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
