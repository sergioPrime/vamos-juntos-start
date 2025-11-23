import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { usePurchases } from '@/hooks/usePurchases'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusColors = {
  pending: 'secondary',
  approved: 'default',
  ordered: 'default',
  received: 'default',
  cancelled: 'destructive',
} as const

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  ordered: 'Pedido Feito',
  received: 'Recebido',
  cancelled: 'Cancelado',
}

const paymentStatusColors = {
  pending: 'secondary',
  partial: 'default',
  paid: 'default',
} as const

const paymentStatusLabels = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
}

export default function Purchases() {
  const navigate = useNavigate()
  const { currentOrg } = useOrganization()
  const { purchases, isLoading, deletePurchase } = usePurchases(currentOrg?.id || '')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredPurchases = purchases?.filter((purchase) => {
    const matchesSearch = purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await deletePurchase.mutateAsync(id)
        toast.success('Pedido excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir pedido')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
        <Button onClick={() => navigate('/purchases/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="ordered">Pedido Feito</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases && filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.purchase_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[purchase.status as keyof typeof statusColors]}>
                        {statusLabels[purchase.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusColors[purchase.payment_status as keyof typeof paymentStatusColors]}>
                        {paymentStatusLabels[purchase.payment_status as keyof typeof paymentStatusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {purchase.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/purchases/${purchase.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
