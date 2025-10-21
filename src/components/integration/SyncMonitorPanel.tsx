import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function SyncMonitorPanel() {
  const { 
    logs, 
    statistics, 
    loading, 
    loadLogs, 
    loadStatistics,
    getFailedLogs,
    getRecentLogs,
    getSyncTypeLabel 
  } = useSyncMonitor();
  
  const [selectedDays, setSelectedDays] = useState(7);

  const handleRefresh = () => {
    loadLogs();
    loadStatistics(selectedDays);
  };

  const failedLogs = getFailedLogs();
  const recentLogs = getRecentLogs(24);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { className: 'bg-success text-success-foreground', label: 'Concluída' },
      failed: { variant: 'destructive', label: 'Falhou' },
      processing: { className: 'bg-warning text-warning-foreground', label: 'Processando' },
      pending: { variant: 'outline', label: 'Pendente' }
    };

    const config = variants[status] || variants.pending;
    return <Badge {...config}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Sincronização</h2>
          <p className="text-muted-foreground">
            Acompanhe a sincronização automática entre módulos
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Últimas 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}</div>
            <p className="text-xs text-muted-foreground">sincronizações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.length > 0
                ? Math.round(
                    statistics.reduce((sum, s) => sum + s.success_rate, 0) / statistics.length
                  )
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">últimos {selectedDays} dias</p>
          </CardContent>
        </Card>

        <Card className={failedLogs.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${failedLogs.length > 0 ? 'text-destructive' : ''}`}>
              {failedLogs.length}
            </div>
            <p className="text-xs text-muted-foreground">sincronizações falhadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Logs Alert */}
      {failedLogs.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {failedLogs.length} sincronização(ões) com falha que requerem atenção.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="statistics">
        <TabsList>
          <TabsTrigger value="statistics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="h-4 w-4 mr-2" />
            Logs Recentes
          </TabsTrigger>
          {failedLogs.length > 0 && (
            <TabsTrigger value="failed" className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Falhas ({failedLogs.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Tipo</CardTitle>
              <CardDescription>
                Desempenho de cada tipo de sincronização nos últimos {selectedDays} dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : statistics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sincronização registrada no período
                </p>
              ) : (
                statistics.map((stat) => (
                  <div key={stat.sync_type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getSyncTypeLabel(stat.sync_type)}</span>
                      <span className="text-sm text-muted-foreground">
                        {stat.successful_syncs}/{stat.total_syncs}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Progress value={stat.success_rate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stat.success_rate.toFixed(1)}% de sucesso</span>
                        {stat.failed_syncs > 0 && (
                          <span className="text-destructive">
                            {stat.failed_syncs} falha(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Sincronização</CardTitle>
              <CardDescription>Últimas 50 sincronizações</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sincronização registrada
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(log.status)}
                        <div className="flex-1">
                          <div className="font-medium">{getSyncTypeLabel(log.sync_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.source_table} → {log.target_table || 'múltiplas tabelas'}
                          </div>
                          {log.error_message && (
                            <div className="text-xs text-destructive mt-1">
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(log.status)}
                        <div className="text-xs text-muted-foreground text-right">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {failedLogs.length > 0 && (
          <TabsContent value="failed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Sincronizações Falhadas</CardTitle>
                <CardDescription>
                  Revise e corrija as sincronizações que falharam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border border-destructive/20 rounded-lg bg-destructive/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-medium">{getSyncTypeLabel(log.sync_type)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Origem: {log.source_table} (ID: {log.source_id})
                      </div>
                      {log.error_message && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            {log.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
