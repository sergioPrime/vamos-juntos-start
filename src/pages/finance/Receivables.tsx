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
import { DollarSign, CheckCircle, Clock, AlertTriangle, Plus, Search, Filter, Download, Eye, Edit, Zap, Copy, QrCode, Target } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ResponsiveTable } from '@/components/ui/responsive-table'

interface ReceivableItem {
  id: string
  customer: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'overdue' | 'paid' | 'partial'
  invoice?: string
  paymentMethod?: string
  notes?: string
  createdAt: string
  paidAt?: string
  pixCode?: string
}

interface ReceivablesSummary {
  totalPending: number
  totalOverdue: number
  totalPaid: number
  dueThisWeek: number
  dueNextWeek: number
  avgCollectionTime: number
}

export default function Receivables() {
  const { currentOrg: currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableItem | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPixDialog, setShowPixDialog] = useState(false)
  const [pixCode, setPixCode] = useState("")

  // Mock data
  const [receivablesSummary] = useState<ReceivablesSummary>({
    totalPending: 89450.00,
    totalOverdue: 15280.00,
    totalPaid: 156780.00,
    dueThisWeek: 18650.00,
    dueNextWeek: 28900.00,
    avgCollectionTime: 24.5
  })

  const [receivables] = useState<ReceivableItem[]>([
    {
      id: '1',
      customer: 'Empresa Alpha Ltda',
      description: 'Desenvolvimento de sistema',
      amount: 15000.00,
      dueDate: '2024-09-18',
      status: 'pending',
      invoice: 'FAT-2024-001',
      notes: 'Pagamento via transferência',
      createdAt: '2024-08-18'
    },
    {
      id: '2',
      customer: 'Beta Corp S.A.',
      description: 'Consultoria empresarial',
      amount: 8500.00,
      dueDate: '2024-09-10',
      status: 'overdue',
      invoice: 'FAT-2024-002',
      paymentMethod: 'PIX',
      createdAt: '2024-08-10'
    },
    {
      id: '3',
      customer: 'Gamma Tech',
      description: 'Licenças de software',
      amount: 12000.00,
      dueDate: '2024-09-15',
      status: 'paid',
      invoice: 'FAT-2024-003',
      paymentMethod: 'Transferência',
      paidAt: '2024-09-14',
      createdAt: '2024-08-15'
    },
    {
      id: '4',
      customer: 'Delta Solutions',
      description: 'Suporte técnico mensal',
      amount: 3500.00,
      dueDate: '2024-09-25',
      status: 'partial',
      invoice: 'FAT-2024-004',
      notes: 'Pagamento parcial de R$ 2.000,00 recebido',
      createdAt: '2024-08-25'
    }
  ])

  useEffect(() => {
    if (currentOrganization) {
      setLoading(false)
    }
  }, [currentOrganization])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600">Pendente</Badge>
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>
      case 'partial':
        return <Badge className="bg-blue-600">Parcial</Badge>
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
      case 'partial':
        return <Target className="h-4 w-4 text-blue-600" />
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

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = receivable.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receivable.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter
    const matchesCustomer = customerFilter === 'all' || receivable.customer === customerFilter
    
    return matchesSearch && matchesStatus && matchesCustomer
  })

  const generatePixCode = () => {
    const randomCode = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${Math.random().toString().slice(2,8)}.005802BR5925Nome do Recebedor6009SAO PAULO62070503***6304`
    setPixCode(randomCode)
    toast({
      title: "Código PIX gerado",
      description: "O código PIX foi gerado com sucesso",
    })
  }

  const markAsPaid = (id: string) => {
    toast({
      title: "Pagamento confirmado",
      description: "A cobrança foi marcada como paga com sucesso",
    })
    setSelectedReceivable(null)
  }

  const sendReminder = (id: string) => {
    toast({
      title: "Lembrete enviado",
      description: "Lembrete de pagamento foi enviado ao cliente",
    })
  }

  if (loading) {
    return <div className="p-6">Carregando contas a receber...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie seus recebimentos e cobranças</p>
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
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conta a Receber</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer">Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alpha">Empresa Alpha Ltda</SelectItem>
                      <SelectItem value="beta">Beta Corp S.A.</SelectItem>
                      <SelectItem value="gamma">Gamma Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Descrição do serviço/produto" />
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
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
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
                  <Button 
                    onClick={() => {
                      setShowAddDialog(false)
                      setShowPixDialog(true)
                    }} 
                    className="flex-1"
                  >
                    Salvar & Gerar PIX
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
                <p className="text-sm font-medium text-muted-foreground">Total a Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(receivablesSummary.totalPending)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">
                Vence esta semana: {formatCurrency(receivablesSummary.dueThisWeek)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(receivablesSummary.totalOverdue)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-red-600">Requer cobrança</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recebido este Mês</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(receivablesSummary.totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">
                Prazo médio: {receivablesSummary.avgCollectionTime} dias
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
                placeholder="Buscar cliente ou descrição"
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
                <SelectItem value="partial">Parcial</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Empresa Alpha Ltda">Empresa Alpha Ltda</SelectItem>
                <SelectItem value="Beta Corp S.A.">Beta Corp S.A.</SelectItem>
                <SelectItem value="Gamma Tech">Gamma Tech</SelectItem>
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
          <CardTitle>Contas a Receber</CardTitle>
          <CardDescription>
            {filteredReceivables.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(receivable.status)}
                        {getStatusBadge(receivable.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{receivable.customer}</TableCell>
                    <TableCell>{receivable.description}</TableCell>
                    <TableCell>{formatCurrency(receivable.amount)}</TableCell>
                    <TableCell>{formatDate(receivable.dueDate)}</TableCell>
                    <TableCell>
                      {receivable.invoice && (
                        <Badge variant="outline">{receivable.invoice}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedReceivable(receivable)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {receivable.status !== 'paid' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsPaid(receivable.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => sendReminder(receivable.id)}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Dialog PIX */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrança PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!pixCode ? (
              <Button onClick={generatePixCode} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Gerar Código PIX
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Código PIX gerado!</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(pixCode)
                      toast({
                        title: "Código copiado",
                        description: "Código PIX copiado para área de transferência",
                      })
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar código
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedReceivable} onOpenChange={() => setSelectedReceivable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
          </DialogHeader>
          {selectedReceivable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{selectedReceivable.customer}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium">{formatCurrency(selectedReceivable.amount)}</p>
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <p>{formatDate(selectedReceivable.dueDate)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReceivable.status)}</div>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <p>{selectedReceivable.description}</p>
              </div>
              {selectedReceivable.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedReceivable.notes}</p>
                </div>
              )}
              
              {selectedReceivable.status !== 'paid' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => markAsPaid(selectedReceivable.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendReminder(selectedReceivable.id)}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Enviar Lembrete
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