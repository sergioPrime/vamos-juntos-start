import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Filter, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const transactionTypeLabels: Record<string, string> = {
  ORDER_MANAGEMENT: 'Gestão de Pedidos',
  FINANCIAL_ENTRY: 'Lançamento Financeiro',
  STOCK_MOVEMENT: 'Movimentação de Estoque',
  PURCHASE: 'Compra',
  CUSTOMER_SUPPLIER: 'Cliente/Fornecedor',
  PRODUCT: 'Produto',
  PDV_SESSION: 'Sessão PDV',
  PDV_MOVEMENT: 'Movimento PDV',
  MODULE_PERMISSION: 'Permissão de Módulo',
  BANK_ACCOUNT: 'Conta Bancária',
};

const actionTypeColors = {
  INSERT: 'default' as const,
  UPDATE: 'secondary' as const,
  DELETE: 'destructive' as const,
};

const actionTypeLabels = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

export function AuditLogsTable() {
  const [transactionType, setTransactionType] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { logs, loading, refresh } = useAuditLogs({
    transactionType: transactionType || undefined,
    actionType: actionType || undefined,
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const getUserName = (log: AuditLog) => {
    if (log.profiles) {
      return `${log.profiles.first_name} ${log.profiles.last_name}`;
    }
    return 'Usuário desconhecido';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Transação</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {Object.entries(transactionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando registros...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo de Transação</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {transactionTypeLabels[log.transaction_type] || log.transaction_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionTypeColors[log.action_type]}>
                          {actionTypeLabels[log.action_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.table_name}
                      </TableCell>
                      <TableCell>{getUserName(log)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro de Auditoria</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Usuário</Label>
                  <p className="font-medium">{getUserName(selectedLog)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Transação</Label>
                  <p className="font-medium">
                    {transactionTypeLabels[selectedLog.transaction_type] || selectedLog.transaction_type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ação</Label>
                  <Badge variant={actionTypeColors[selectedLog.action_type]}>
                    {actionTypeLabels[selectedLog.action_type]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tabela</Label>
                  <p className="font-mono text-sm">{selectedLog.table_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID do Registro</Label>
                  <p className="font-mono text-sm">{selectedLog.record_id}</p>
                </div>
              </div>

              {selectedLog.action_type === 'UPDATE' && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Dados Anteriores</Label>
                    <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dados Novos</Label>
                    <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {selectedLog.action_type === 'DELETE' && (
                <div>
                  <Label className="text-muted-foreground">Dados Excluídos</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.action_type === 'INSERT' && (
                <div>
                  <Label className="text-muted-foreground">Dados Criados</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
