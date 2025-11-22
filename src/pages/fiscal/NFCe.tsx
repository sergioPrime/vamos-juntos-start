import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Search, Download, X, Eye, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useContingencyMode } from '@/hooks/useContingencyMode'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NFCe() {
  const { currentOrg } = useOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { isActive: contingencyActive, queueCount, syncQueue } = useContingencyMode()

  // Buscar NFC-e
  const { data: nfceList, isLoading, refetch } = useQuery({
    queryKey: ['nfce', currentOrg?.id, statusFilter],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      let query = (supabase as any)
        .from('nfce')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('data_emissao', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!currentOrg?.id,
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      rascunho: { variant: 'secondary', label: 'Rascunho' },
      processando: { variant: 'default', label: 'Processando' },
      autorizada: { variant: 'default', label: 'Autorizada' },
      rejeitada: { variant: 'destructive', label: 'Rejeitada' },
      cancelada: { variant: 'outline', label: 'Cancelada' },
      denegada: { variant: 'destructive', label: 'Denegada' },
    }

    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTipoEmissaoBadge = (tipo: string) => {
    return tipo === 'contingencia' ? (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Contingência
      </Badge>
    ) : (
      <Badge variant="outline">Normal</Badge>
    )
  }

  const filteredNFCe = nfceList?.filter((nfce: any) =>
    searchTerm === '' ||
    nfce.numero?.toString().includes(searchTerm) ||
    nfce.chave_acesso?.includes(searchTerm) ||
    nfce.destinatario_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const summary = {
    total: nfceList?.length || 0,
    autorizadas: nfceList?.filter((n: any) => n.status === 'autorizada').length || 0,
    rejeitadas: nfceList?.filter((n: any) => n.status === 'rejeitada').length || 0,
    totalValue: nfceList?.reduce((sum: number, n: any) => sum + (n.valor_total || 0), 0) || 0,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            NFC-e
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de Notas Fiscais de Consumidor Eletrônicas
          </p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Nova NFC-e
        </Button>
      </div>

      {/* Alerta de Contingência */}
      {contingencyActive && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-yellow-600">
              Modo de contingência ativo - {queueCount} nota(s) na fila
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => syncQueue()}
              className="ml-4"
            >
              Sincronizar agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autorizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.autorizadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.rejeitadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por número, chave ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="processando">Processando</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredNFCe && filteredNFCe.length > 0 ? (
                filteredNFCe.map((nfce: any) => (
                  <TableRow key={nfce.id}>
                    <TableCell className="font-mono">{nfce.numero}</TableCell>
                    <TableCell>{nfce.serie}</TableCell>
                    <TableCell>{nfce.destinatario_nome || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getTipoEmissaoBadge(nfce.tipo_emissao)}</TableCell>
                    <TableCell>
                      R$ {nfce.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        {nfce.status === 'autorizada' && (
                          <Button variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma NFC-e encontrada
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
