import { useEffect, useState } from 'react'
import { useBlockchain } from '@/hooks/useBlockchain'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock, Database, Users, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function Blockchain() {
  const { 
    loading, 
    getBlockchainRecords, 
    getBlockchainStatistics, 
    validateBlockchainChain 
  } = useBlockchain()

  const [records, setRecords] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [recordsData, statsData] = await Promise.all([
      getBlockchainRecords({ limit: 50 }),
      getBlockchainStatistics()
    ])

    setRecords(recordsData)
    setStatistics(statsData)
  }

  const handleValidate = async () => {
    setValidating(true)
    const result = await validateBlockchainChain()
    setValidation(result)
    setValidating(false)
    
    // Reload data after validation
    await loadData()
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      financial: 'Financeiro',
      stock: 'Estoque',
      fiscal: 'Fiscal',
      order: 'Pedido',
      purchase: 'Compra'
    }
    return labels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      financial: 'bg-green-500/10 text-green-500 border-green-500/20',
      stock: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      fiscal: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      order: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      purchase: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }
    return colors[type] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Blockchain & Segurança
          </h1>
          <p className="text-muted-foreground">
            Sistema de auditoria imutável baseado em blockchain para garantir integridade dos dados
          </p>
        </div>
        
        <Button onClick={loadData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Blocos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_blocks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registros na blockchain
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocos Válidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {statistics?.valid_blocks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Integridade verificada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Transação</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.transaction_types || 0}</div>
            <p className="text-xs text-muted-foreground">
              Categorias monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.unique_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Criadores de transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validação de Integridade
          </CardTitle>
          <CardDescription>
            Verifique a integridade da cadeia blockchain e detecte possíveis adulterações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleValidate} 
            disabled={validating || loading}
            className="w-full sm:w-auto"
          >
            {validating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Validar Blockchain
              </>
            )}
          </Button>

          {validation && (
            <div className={`p-4 rounded-lg border ${
              validation.is_valid 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-start gap-3">
                {validation.is_valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    validation.is_valid ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {validation.validation_message}
                  </h4>
                  <div className="mt-2 text-sm space-y-1">
                    <p>Total de blocos: <strong>{validation.total_blocks}</strong></p>
                    {validation.invalid_blocks > 0 && (
                      <>
                        <p className="text-red-500">
                          Blocos inválidos: <strong>{validation.invalid_blocks}</strong>
                        </p>
                        <p className="text-red-500">
                          Primeiro bloco inválido: <strong>#{validation.first_invalid_block}</strong>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Records */}
      <Card>
        <CardHeader>
          <CardTitle>Registros da Blockchain</CardTitle>
          <CardDescription>
            Histórico completo de todas as transações registradas na blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="stock">Estoque</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
              <TabsTrigger value="order">Pedidos</TabsTrigger>
              <TabsTrigger value="purchase">Compras</TabsTrigger>
            </TabsList>

            {['all', 'financial', 'stock', 'fiscal', 'order', 'purchase'].map(type => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bloco</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hash</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records
                        .filter(r => type === 'all' || r.transaction_type === type)
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono font-semibold">
                              #{record.block_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTransactionTypeColor(record.transaction_type)}>
                                {getTransactionTypeLabel(record.transaction_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {record.table_name}
                            </TableCell>
                            <TableCell>
                              {record.is_valid ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Válido
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inválido
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {record.current_hash.substring(0, 16)}...
                            </TableCell>
                            <TableCell className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(record.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      
                      {records.filter(r => type === 'all' || r.transaction_type === type).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
