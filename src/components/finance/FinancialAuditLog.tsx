import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Eye, Edit, Trash2, CheckCircle, FileText } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface AuditEntry {
  id: string
  action_type: string
  table_name: string
  record_id: string
  old_data: any
  new_data: any
  user_id: string
  created_at: string
  user_email?: string
}

export function FinancialAuditLog() {
  const { currentOrg } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [audits, setAudits] = useState<AuditEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (currentOrg?.id) {
      loadAuditLogs()
    }
  }, [currentOrg?.id, actionFilter, page])

  const loadAuditLogs = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)

      let query = supabase
        .from('transaction_audit')
        .select('*')
        .eq('org_id', currentOrg.id)
        .in('table_name', ['financial_entries', 'financial_transactions', 'bank_accounts'])
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Buscar emails dos usuários
      const userIds = [...new Set(data?.map(a => a.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || [])

      const auditEntries: AuditEntry[] = data?.map(audit => ({
        id: audit.id,
        action_type: audit.action_type,
        table_name: audit.table_name,
        record_id: audit.record_id,
        old_data: audit.old_data,
        new_data: audit.new_data,
        user_id: audit.user_id,
        created_at: audit.created_at,
        user_email: emailMap.get(audit.user_id)
      })) || []

      setAudits(auditEntries)

    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Criação</Badge>
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Edição</Badge>
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Exclusão</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      'financial_entries': 'Lançamentos Financeiros',
      'financial_transactions': 'Transações Bancárias',
      'bank_accounts': 'Contas Bancárias'
    }
    return labels[tableName] || tableName
  }

  const formatChanges = (audit: AuditEntry) => {
    if (audit.action_type === 'INSERT') {
      return 'Novo registro criado'
    }
    if (audit.action_type === 'DELETE') {
      return 'Registro excluído'
    }
    if (audit.action_type === 'UPDATE' && audit.old_data && audit.new_data) {
      const changes = []
      for (const key in audit.new_data) {
        if (audit.old_data[key] !== audit.new_data[key]) {
          changes.push(`${key}: ${audit.old_data[key]} → ${audit.new_data[key]}`)
        }
      }
      return changes.length > 0 ? changes.join(', ') : 'Sem alterações detectadas'
    }
    return 'Ação realizada'
  }

  const filteredAudits = audits.filter(audit => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      audit.user_email?.toLowerCase().includes(searchLower) ||
      audit.table_name.toLowerCase().includes(searchLower) ||
      formatChanges(audit).toLowerCase().includes(searchLower)
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoria Financeira</CardTitle>
        <CardDescription>
          Registro completo de todas as operações financeiras realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, tabela ou alteração..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Ações</SelectItem>
                <SelectItem value="INSERT">Criações</SelectItem>
                <SelectItem value="UPDATE">Edições</SelectItem>
                <SelectItem value="DELETE">Exclusões</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Auditoria */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro de auditoria encontrado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Data/Hora</TableHead>
                    <TableHead className="w-24">Ação</TableHead>
                    <TableHead className="w-48">Tabela</TableHead>
                    <TableHead>Alterações</TableHead>
                    <TableHead className="w-48">Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="text-xs">
                        {format(new Date(audit.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(audit.action_type)}
                          {getActionBadge(audit.action_type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getTableLabel(audit.table_name)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {formatChanges(audit)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {audit.user_email || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page} • {filteredAudits.length} registros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={filteredAudits.length < pageSize}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
