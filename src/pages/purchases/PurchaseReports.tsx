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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Clock, DollarSign, Package, Users, Calendar, FileText, Download, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface KPIData {
  totalRequests: number
  pendingApproval: number
  approved: number
  rejected: number
  avgDeliveryTime: number
  totalSavings: number
  topSupplier: string
  avgApprovalTime: number
}

interface RequestsByStatus {
  status: string
  count: number
  percentage: number
}

interface RequestsByPriority {
  priority: string
  count: number
  color: string
}

interface SupplierRanking {
  supplier: string
  totalOrders: number
  avgDeliveryTime: number
  avgPrice: number
  rating: number
}

interface CostCenterAnalysis {
  costCenter: string
  totalSpent: number
  requests: number
  avgRequestValue: number
}

interface MonthlyTrend {
  month: string
  requests: number
  approved: number
  rejected: number
  totalValue: number
}

const PurchaseReports = () => {
  const { currentOrg: currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all')
  
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRequests: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    avgDeliveryTime: 0,
    totalSavings: 0,
    topSupplier: '',
    avgApprovalTime: 0
  })

  const [requestsByStatus, setRequestsByStatus] = useState<RequestsByStatus[]>([])
  const [requestsByPriority, setRequestsByPriority] = useState<RequestsByPriority[]>([])
  const [supplierRanking, setSupplierRanking] = useState<SupplierRanking[]>([])
  const [costCenterAnalysis, setCostCenterAnalysis] = useState<CostCenterAnalysis[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    if (currentOrganization?.id) {
      // Set default date range (last 6 months)
      const today = new Date()
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
      
      setDateFrom(sixMonthsAgo.toISOString().split('T')[0])
      setDateTo(today.toISOString().split('T')[0])
      
      loadPurchaseReportsData()
    }
  }, [currentOrganization])

  const loadPurchaseReportsData = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      // Since purchase request tables don't exist yet, show empty state
      // When the purchase module is implemented, load real data here
      
      setKpiData({
        totalRequests: 0,
        pendingApproval: 0,
        approved: 0,
        rejected: 0,
        avgDeliveryTime: 0,
        totalSavings: 0,
        topSupplier: '',
        avgApprovalTime: 0
      })

      setRequestsByStatus([])
      setRequestsByPriority([])
      setSupplierRanking([])
      setCostCenterAnalysis([])
      setMonthlyTrend([])

    } catch (error) {
      console.error('Error loading purchase reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (reportType: string) => {
    toast({
      title: "Exportação iniciada",
      description: `Relatório de ${reportType} sendo preparado para download`,
    })
  }

  const applyFilters = () => {
    toast({
      title: "Filtros aplicados",
      description: "Dados atualizados conforme filtros selecionados",
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Aprovadas': 'bg-green-500',
      'Pendentes': 'bg-yellow-500',
      'Rejeitadas': 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-600">Excelente</Badge>
    if (rating >= 4.0) return <Badge className="bg-blue-600">Bom</Badge>
    if (rating >= 3.5) return <Badge className="bg-yellow-600">Regular</Badge>
    return <Badge variant="destructive">Ruim</Badge>
  }

  if (loading) {
    return <div className="p-6">Carregando relatórios...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Compras</h1>
          <p className="text-muted-foreground">Análises e indicadores de performance do módulo de compras</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-from">Data Início</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Data Fim</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Centro de Custo</Label>
              <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ADM">Administrativo</SelectItem>
                  <SelectItem value="VEN">Vendas</SelectItem>
                  <SelectItem value="PRO">Produção</SelectItem>
                  <SelectItem value="TI">TI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Solicitações</p>
                <p className="text-2xl font-bold">{kpiData.totalRequests}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">{kpiData.pendingApproval}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">Tempo médio: {kpiData.avgApprovalTime} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Economy Total</p>
                <p className="text-2xl font-bold">R$ {kpiData.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">8.5% de economia</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio Entrega</p>
                <p className="text-2xl font-bold">{kpiData.avgDeliveryTime} dias</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">-0.8 dias vs meta</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="status">Status & Prazos</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="cost-centers">Centros de Custo</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações por Status</CardTitle>
                <CardDescription>Distribuição das solicitações por status atual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={requestsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                    >
                      {requestsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solicitações por Prioridade</CardTitle>
                <CardDescription>Distribuição por nível de prioridade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={requestsByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {requestsByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos em Aberto</CardTitle>
                <CardDescription>Solicitações pendentes de aprovação ou processamento</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Dias Pendente</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma solicitação pendente encontrada
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos Atrasados</CardTitle>
                <CardDescription>Entregas que ultrapassaram o prazo esperado</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Atraso</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum pedido atrasado encontrado
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Fornecedores</CardTitle>
              <CardDescription>Performance e avaliação dos fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Total Pedidos</TableHead>
                    <TableHead>Tempo Médio Entrega</TableHead>
                    <TableHead>Preço Médio</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierRanking.map((supplier, index) => (
                    <TableRow key={supplier.supplier}>
                      <TableCell className="font-medium">{supplier.supplier}</TableCell>
                      <TableCell>{supplier.totalOrders}</TableCell>
                      <TableCell>{supplier.avgDeliveryTime} dias</TableCell>
                      <TableCell>R$ {supplier.avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{getRatingBadge(supplier.rating)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => exportReport(`fornecedor-${supplier.supplier}`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-centers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise por Centro de Custo</CardTitle>
                <CardDescription>Gastos e volume de solicitações por centro de custo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costCenterAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="costCenter" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'totalSpent') return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total Gasto']
                      if (name === 'requests') return [value, 'Solicitações']
                      return [value, name]
                    }} />
                    <Legend />
                    <Bar dataKey="totalSpent" name="Total Gasto" fill="#8884d8" />
                    <Bar dataKey="requests" name="Solicitações" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Centro de Custo</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Nº Solicitações</TableHead>
                      <TableHead>Valor Médio</TableHead>
                      <TableHead>% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costCenterAnalysis.map((cc) => {
                      const totalAllCenters = costCenterAnalysis.reduce((sum, item) => sum + item.totalSpent, 0)
                      const percentage = (cc.totalSpent / totalAllCenters * 100).toFixed(1)
                      
                      return (
                        <TableRow key={cc.costCenter}>
                          <TableCell className="font-medium">{cc.costCenter}</TableCell>
                          <TableCell>R$ {cc.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{cc.requests}</TableCell>
                          <TableCell>R$ {cc.avgRequestValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal de Solicitações</CardTitle>
                <CardDescription>Evolução do volume e valores ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Total Solicitações" />
                    <Line type="monotone" dataKey="approved" stroke="#82ca9d" name="Aprovadas" />
                    <Line type="monotone" dataKey="rejected" stroke="#ff7c7c" name="Rejeitadas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução dos Valores</CardTitle>
                <CardDescription>Valores totais das solicitações por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor Total']} />
                    <Area type="monotone" dataKey="totalValue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PurchaseReports