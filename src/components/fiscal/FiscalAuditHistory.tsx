import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, FileText, ShoppingCart, Receipt, Clock, User, CheckCircle2, XCircle, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BlockchainRecord {
  id: string;
  block_number: number;
  table_name: string;
  transaction_type: string;
  data_snapshot: any;
  timestamp: string;
  user_id: string | null;
  is_valid: boolean;
  current_hash: string;
}

export function FiscalAuditHistory() {
  const { currentOrg } = useOrganization();
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<BlockchainRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (currentOrg?.id) {
      loadAuditRecords();
    }
  }, [currentOrg]);

  const loadAuditRecords = async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blockchain_records')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('transaction_type', 'fiscal')
        .in('table_name', ['tax_groups', 'sales_categories', 'fiscal_operations'])
        .order('block_number', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading audit records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-3 w-3" />;
      case 'UPDATE':
        return <Edit className="h-3 w-3" />;
      case 'DELETE':
        return <Trash2 className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'tax_groups':
        return <FileText className="h-4 w-4" />;
      case 'sales_categories':
        return <ShoppingCart className="h-4 w-4" />;
      case 'fiscal_operations':
        return <Receipt className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      tax_groups: 'Grupos Tributários',
      sales_categories: 'Categorias de Vendas',
      fiscal_operations: 'Operações Fiscais',
    };
    return labels[tableName] || tableName;
  };

  const filterRecordsByTable = (tableName: string) => {
    return records.filter(r => r.table_name === tableName);
  };

  const showRecordDetails = (record: BlockchainRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const renderRecordsTable = (filteredRecords: BlockchainRecord[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bloco</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead className="text-right">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Carregando...
              </TableCell>
            </TableRow>
          ) : filteredRecords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredRecords.map((record) => (
              <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono font-semibold">
                  #{record.block_number}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getActionColor(record.data_snapshot.action)}>
                    <span className="mr-1">{getActionIcon(record.data_snapshot.action)}</span>
                    {record.data_snapshot.action}
                  </Badge>
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
                <TableCell className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {format(new Date(record.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-sm">
                  {record.user_id ? (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs">{record.user_id.substring(0, 8)}...</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showRecordDetails(record)}
                  >
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Histórico de Auditoria Fiscal</CardTitle>
              <CardDescription>
                Registro imutável de todas as alterações em configurações fiscais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todos ({records.length})
              </TabsTrigger>
              <TabsTrigger value="tax_groups">
                Grupos Tributários ({filterRecordsByTable('tax_groups').length})
              </TabsTrigger>
              <TabsTrigger value="sales_categories">
                Categorias ({filterRecordsByTable('sales_categories').length})
              </TabsTrigger>
              <TabsTrigger value="fiscal_operations">
                Operações ({filterRecordsByTable('fiscal_operations').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderRecordsTable(records)}
            </TabsContent>

            <TabsContent value="tax_groups" className="mt-4">
              {renderRecordsTable(filterRecordsByTable('tax_groups'))}
            </TabsContent>

            <TabsContent value="sales_categories" className="mt-4">
              {renderRecordsTable(filterRecordsByTable('sales_categories'))}
            </TabsContent>

            <TabsContent value="fiscal_operations" className="mt-4">
              {renderRecordsTable(filterRecordsByTable('fiscal_operations'))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecord && getTableIcon(selectedRecord.table_name)}
              Detalhes do Registro #{selectedRecord?.block_number}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && getTableLabel(selectedRecord.table_name)} - {selectedRecord?.data_snapshot.action}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Informações do Bloco */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Número do Bloco</p>
                    <p className="font-mono font-semibold">#{selectedRecord.block_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Hash</p>
                    <p className="font-mono text-xs break-all">{selectedRecord.current_hash}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                    <p>{format(new Date(selectedRecord.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {selectedRecord.is_valid ? (
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
                  </div>
                </div>

                {/* Dados da Transação */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dados da Transação
                  </h4>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedRecord.data_snapshot, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Detalhes das Alterações (apenas para UPDATE) */}
                {selectedRecord.data_snapshot.action === 'UPDATE' && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Alterações Realizadas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-500">Valores Anteriores</p>
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                          <pre className="text-xs">
                            {JSON.stringify(selectedRecord.data_snapshot.old_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-500">Novos Valores</p>
                        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                          <pre className="text-xs">
                            {JSON.stringify(selectedRecord.data_snapshot.new_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
