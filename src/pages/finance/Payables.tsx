import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, DollarSign, AlertTriangle, CheckCircle, Clock, Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PayableItem {
  id: string
  supplier: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'overdue' | 'paid' | 'scheduled'
  category: string
  paymentMethod?: string
  notes?: string
  createdAt: string
}

interface PayablesSummary {
  totalPending: number
  totalOverdue: number
  totalPaid: number
  dueThisWeek: number
  dueNextWeek: number
  avgPaymentTerm: number
}

export default function Payables() {
  const { currentOrg: currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const [payablesSummary, setPayablesSummary] = useState<PayablesSummary>({
    totalPending: 0,
    totalOverdue: 0,
    totalPaid: 0,
    dueThisWeek: 0,
    dueNextWeek: 0,
    avgPaymentTerm: 0
  })

  const [payables, setPayables] = useState<PayableItem[]>([])

  useEffect(() => {
    if (currentOrganization?.id) {
      loadPayablesData()
    }
  }, [currentOrganization])

  const loadPayablesData = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      // Load actual payables data from financial_transactions table
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('transaction_type', 'outflow')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading payables:', error)
        return
      }

      // Transform transactions into payables format
      const payablesData: PayableItem[] = (transactions || []).map(transaction => ({
        id: transaction.id,
        supplier: transaction.description || 'Fornecedor não informado',
        description: transaction.description || '',
        amount: Number(transaction.amount),
        dueDate: transaction.transaction_date,
        status: 'paid', // Since these are completed transactions
        category: transaction.category || 'Outros',
        createdAt: transaction.created_at
      }))

      setPayables(payablesData)

      // Calculate summary
      const totalPaid = payablesData.reduce((sum, item) => sum + item.amount, 0)
      setPayablesSummary({
        totalPending: 0,
        totalOverdue: 0,
        totalPaid,
        dueThisWeek: 0,
        dueNextWeek: 0,
        avgPaymentTerm: 0
      })

    } catch (error) {
      console.error('Error loading payables data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600">Pendente</Badge>
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-600">Agendado</Badge>
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'scheduled':
        return <CalendarDays className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const filteredPayables = payables.filter(payable => {
    const matchesSearch = payable.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payable.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || payable.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handlePayPayable = (id: string) => {
    toast({
      title: "Pagamento processado",
      description: "A conta foi marcada como paga com sucesso",
    })
  }

  const handleSchedulePayment = (id: string) => {
    toast({
      title: "Pagamento agendado",
      description: "O pagamento foi agendado com sucesso",
    })
  }

  if (loading) {
    return <div className="p-6">Carregando contas a pagar...</div>
  }

  return (
    <div className="page-container container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie suas despesas e pagamentos</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conta a Pagar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input id="supplier" placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Descrição da despesa" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Valor</Label>
                    <Input id="amount" type="number" placeholder="0,00" />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Vencimento</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="ti">TI</SelectItem>
                      <SelectItem value="utilities">Utilidades</SelectItem>
                      <SelectItem value="services">Serviços</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" placeholder="Observações adicionais" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowAddDialog(false)} className="flex-1">
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumo KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold">{formatCurrency(payablesSummary.totalPending)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">
                Vence esta semana: {formatCurrency(payablesSummary.dueThisWeek)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(payablesSummary.totalOverdue)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-red-600">Requer atenção imediata</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pago este Mês</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(payablesSummary.totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">
                Prazo médio: {payablesSummary.avgPaymentTerm} dias
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Pesquisa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor ou descrição"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Material">Material</SelectItem>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="Utilidades">Utilidades</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            {filteredPayables.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payable.status)}
                      {getStatusBadge(payable.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{payable.supplier}</TableCell>
                  <TableCell>{payable.description}</TableCell>
                  <TableCell>{formatCurrency(payable.amount)}</TableCell>
                  <TableCell>{formatDate(payable.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payable.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedPayable(payable)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payable.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePayPayable(payable.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedPayable} onOpenChange={() => setSelectedPayable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>
          {selectedPayable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fornecedor</Label>
                  <p className="font-medium">{selectedPayable.supplier}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium">{formatCurrency(selectedPayable.amount)}</p>
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <p>{formatDate(selectedPayable.dueDate)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayable.status)}</div>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <p>{selectedPayable.description}</p>
              </div>
              {selectedPayable.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayable.notes}</p>
                </div>
              )}
              
              {selectedPayable.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handlePayPayable(selectedPayable.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleSchedulePayment(selectedPayable.id)}
                    className="flex-1"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}