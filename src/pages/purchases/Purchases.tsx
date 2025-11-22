import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePurchases } from "@/hooks/usePurchases"
import { Plus, Search, Eye, Trash2, CheckCircle } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function Purchases() {
  const navigate = useNavigate()
  const { purchases, isLoading, deletePurchase, changeStatus } = usePurchases()
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredPurchases = purchases?.filter(p => 
    p.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pessoas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pessoas?.razao_social?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos de compra</p>
        </div>
        <Button onClick={() => navigate('/purchases/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases?.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                    <TableCell>
                      {purchase.pessoas?.razao_social || purchase.pessoas?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {purchase.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/purchases/${purchase.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {purchase.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => changeStatus({ id: purchase.id, status: 'received' })}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}

                        {purchase.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o pedido {purchase.purchase_number}?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePurchase(purchase.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
