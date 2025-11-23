import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  User
} from "lucide-react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function AdminAuditLogs() {
  const { logs, loading, error, refresh, getStats } = useAdminAuditLogs()
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const stats = getStats()

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-destructive" />
      case 'activate':
        return <Shield className="h-4 w-4 text-green-500" />
      case 'deactivate':
        return <Shield className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'create':
      case 'activate':
        return 'default'
      case 'update':
        return 'secondary'
      case 'delete':
      case 'deactivate':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Criação'
      case 'update':
        return 'Atualização'
      case 'delete':
        return 'Exclusão'
      case 'activate':
        return 'Ativação'
      case 'deactivate':
        return 'Desativação'
      default:
        return action
    }
  }

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'subscription_plan':
        return 'Plano de Assinatura'
      case 'user_role':
        return 'Permissão de Usuário'
      case 'webhook':
        return 'Webhook'
      case 'organization':
        return 'Organização'
      default:
        return entityType
    }
  }

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action_type !== actionFilter) return false
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false
    if (searchTerm && !log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">Erro ao carregar logs: {error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Criações</p>
                <p className="text-2xl font-bold text-green-500">{stats.creates}</p>
              </div>
              <Plus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Edições</p>
                <p className="text-2xl font-bold text-blue-500">{stats.updates}</p>
              </div>
              <Edit className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusões</p>
                <p className="text-2xl font-bold text-destructive">{stats.deletes}</p>
              </div>
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Logs de Auditoria</CardTitle>
            <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="activate">Ativação</SelectItem>
                <SelectItem value="deactivate">Desativação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Entidades</SelectItem>
                <SelectItem value="subscription_plan">Planos</SelectItem>
                <SelectItem value="user_role">Permissões</SelectItem>
                <SelectItem value="webhook">Webhooks</SelectItem>
                <SelectItem value="organization">Organizações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum log encontrado</p>
              <p className="text-sm mt-1">
                {searchTerm || actionFilter !== 'all' || entityFilter !== 'all'
                  ? 'Tente ajustar os filtros' 
                  : 'Ações administrativas aparecerão aqui'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Collapsible 
                  key={log.id}
                  open={expandedLog === log.id}
                  onOpenChange={(open) => setExpandedLog(open ? log.id : null)}
                >
                  <Card>
                    <CardContent className="p-4">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3 flex-1">
                            {getActionIcon(log.action_type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant={getActionVariant(log.action_type)} className="text-xs">
                                  {getActionLabel(log.action_type)}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {getEntityLabel(log.entity_type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {log.user_email || 'Sistema'}
                                </span>
                                <span>•</span>
                                <span>
                                  {formatDistanceToNow(new Date(log.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            {expandedLog === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {log.old_values && (
                            <div>
                              <p className="text-sm font-medium mb-2">Valores Anteriores:</p>
                              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.new_values && (
                            <div>
                              <p className="text-sm font-medium mb-2">Novos Valores:</p>
                              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.metadata && (
                            <div>
                              <p className="text-sm font-medium mb-2">Metadados:</p>
                              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">ID do Log:</span> {log.id}
                              </div>
                              <div>
                                <span className="font-medium">ID da Entidade:</span> {log.entity_id}
                              </div>
                              <div>
                                <span className="font-medium">ID do Usuário:</span> {log.user_id}
                              </div>
                              <div>
                                <span className="font-medium">Data/Hora:</span>{' '}
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
