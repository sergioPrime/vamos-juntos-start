import { useState } from 'react'
import { Plus, FileText, Eye, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { usePurchases } from '@/hooks/usePurchases'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  received: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
}

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  received: 'Recebido',
  cancelled: 'Cancelado',
}

export default function Purchases() {
  const navigate = useNavigate()
  const { purchases, isLoading, deletePurchase, changeStatus } = usePurchases()

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este pedido de compra?')) {
      await deletePurchase(id)
    }
  }

  const handleReceive = async (id: string) => {
    if (window.confirm('Confirmar recebimento deste pedido de compra?')) {
      await changeStatus({ purchaseId: id, status: 'received' })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-muted-foreground">Gerencie seus pedidos de compra</p>
        </div>
        <Button onClick={() => navigate('/purchases/requests')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      <Card className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : purchases && purchases.length > 0 ? (
                purchases.map((purchase: any) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.purchase_number || '-'}
                    </TableCell>
                    <TableCell>
                      {purchase.supplier?.nome_razao_social || 'Sem fornecedor'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[purchase.status as keyof typeof statusColors] || ''}
                      >
                        {statusLabels[purchase.status as keyof typeof statusLabels] || purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {purchase.total_amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {purchase.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReceive(purchase.id)}
                            title="Confirmar Recebimento"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {purchase.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(purchase.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhum pedido de compra encontrado
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/purchases/requests')}
                        className="mt-2"
                      >
                        Criar Primeira Solicitação
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
