import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePurchases } from "@/hooks/usePurchases"
import { ArrowLeft, Edit, CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PurchaseDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { fetchPurchase, changeStatus } = usePurchases()
  
  const [purchase, setPurchase] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPurchase()
    }
  }, [id])

  const loadPurchase = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await fetchPurchase(id)
      setPurchase(data.purchase)
      setItems(data.items || [])
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pedido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => {
    if (!id) return
    changeStatus({ id, status: 'approved' }, {
      onSuccess: () => {
        loadPurchase()
      }
    })
  }

  const handleReceive = () => {
    if (!id) return
    changeStatus({ id, status: 'received' }, {
      onSuccess: () => {
        loadPurchase()
      }
    })
  }

  const handleCancel = () => {
    if (!id) return
    changeStatus({ id, status: 'cancelled' }, {
      onSuccess: () => {
        loadPurchase()
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      approved: { label: "Aprovado", className: "bg-blue-500" },
      received: { label: "Recebido", className: "bg-green-500" },
      cancelled: { label: "Cancelado", className: "bg-red-500" }
    }
    const variant = variants[status as keyof typeof variants] || { label: status, className: "bg-gray-500" }
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Pedido não encontrado</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido {purchase.purchase_number}</h1>
            <p className="text-muted-foreground">
              Criado em {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {purchase.status === 'pending' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/purchases/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
          {purchase.status === 'approved' && (
            <Button onClick={handleReceive}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Receber Mercadoria
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(purchase.status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {purchase.pessoas?.razao_social || purchase.pessoas?.nome || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {purchase.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
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
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Preço Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.product_name || item.products?.descricao}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    R$ {item.unit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {item.total_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold">
                R$ {purchase.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
