import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Eye, 
  Edit, 
  History, 
  MoreHorizontal, 
  CheckCircle, 
  Mail, 
  FileText, 
  Download,
  Handshake
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { OverdueReceivable } from '@/hooks/useOverdueReceivables'

interface OverdueReceivablesTableProps {
  receivables: OverdueReceivable[]
  loading: boolean
  onSettle: (id: string) => void
  onEdit: (id: string) => void
}

export function OverdueReceivablesTable({ 
  receivables, 
  loading, 
  onSettle, 
  onEdit 
}: OverdueReceivablesTableProps) {
  const [selectedReceivable, setSelectedReceivable] = useState<OverdueReceivable | null>(null)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
  }

  const getDaysOverdueBadge = (days: number) => {
    if (days <= 30) {
      return <Badge variant="destructive">{days} dias</Badge>
    } else if (days <= 60) {
      return <Badge variant="destructive">{days} dias</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-600">{days} dias</Badge>
    }
  }

  const handleMoreActions = (action: string, receivable: OverdueReceivable) => {
    switch (action) {
      case 'email':
        // Implementar envio de email de cobrança
        console.log('Enviar email para:', receivable.customer_name)
        break
      case 'boleto':
        // Implementar geração de segunda via do boleto
        console.log('Gerar boleto para:', receivable.entry_code)
        break
      case 'pdf':
        // Implementar exportação em PDF
        console.log('Exportar PDF:', receivable.entry_code)
        break
      case 'renegotiate':
        // Implementar renegociação
        console.log('Renegociar:', receivable.entry_code)
        break
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor Original</TableHead>
              <TableHead>Valor em Aberto</TableHead>
              <TableHead>Dias em Atraso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((receivable) => (
              <TableRow key={receivable.id}>
                <TableCell className="font-medium">
                  {receivable.entry_code}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => {
                      if (receivable.customer_id) {
                        // Navegar para o cadastro do cliente
                        console.log('Navegar para cliente:', receivable.customer_id)
                      }
                    }}
                  >
                    {receivable.customer_name}
                  </Button>
                </TableCell>
                <TableCell>{formatDate(receivable.issue_date)}</TableCell>
                <TableCell>{formatDate(receivable.due_date)}</TableCell>
                <TableCell>{formatCurrency(receivable.original_amount)}</TableCell>
                <TableCell>{formatCurrency(receivable.open_amount)}</TableCell>
                <TableCell>{getDaysOverdueBadge(receivable.days_overdue)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{receivable.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSettle(receivable.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Quitar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(receivable.id)}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReceivable(receivable)
                        setShowHistoryDialog(true)
                      }}
                    >
                      <History className="h-4 w-4" />
                      Histórico
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border z-50">
                        <DropdownMenuItem onClick={() => handleMoreActions('email', receivable)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar E-mail de Cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoreActions('boleto', receivable)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Gerar Segunda Via do Boleto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoreActions('pdf', receivable)}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar em PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoreActions('renegotiate', receivable)}>
                          <Handshake className="h-4 w-4 mr-2" />
                          Gerar Acordo/Renegociação
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTable>

      {/* Dialog de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Histórico do Documento</DialogTitle>
            <DialogDescription>
              Código: {selectedReceivable?.entry_code} - {selectedReceivable?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Funcionalidade de histórico será implementada em breve.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}