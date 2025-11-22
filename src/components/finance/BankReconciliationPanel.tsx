import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankReconciliation, BankTransaction } from '@/hooks/useBankReconciliation';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Search,
  FileDown,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { ReconciliationMatchDialog } from './ReconciliationMatchDialog';

export function BankReconciliationPanel() {
  const { accounts } = useBankAccounts();
  const { currentOrg } = useOrganization();
  const {
    loading,
    importExtract,
    getReconciliationStats,
    unreconcileTransaction
  } = useBankReconciliation();

  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
      loadStats();
    }
  }, [selectedAccount, startDate, endDate]);

  const loadTransactions = async () => {
    if (!selectedAccount || !currentOrg?.id) return;

    setLoadingTransactions(true);
    try {
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('bank_account_id', selectedAccount)
        .order('transaction_date', { ascending: false });

      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadStats = async () => {
    if (!selectedAccount) return;
    const data = await getReconciliationStats(selectedAccount, startDate, endDate);
    setStats(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAccount) return;

    const success = await importExtract(selectedAccount, file);
    if (success) {
      loadTransactions();
      loadStats();
    }

    // Clear input
    event.target.value = '';
  };

  const handleUnreconcile = async (transactionId: string) => {
    const success = await unreconcileTransaction(transactionId);
    if (success) {
      loadTransactions();
      loadStats();
    }
  };

  const handleOpenMatchDialog = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setShowMatchDialog(true);
  };

  const pendingTransactions = transactions.filter(t => !t.reconciled);
  const reconciledTransactions = transactions.filter(t => t.reconciled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conciliação Bancária</CardTitle>
          <CardDescription>
            Importe extratos e concilie com seus lançamentos financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="bank-account">Conta Bancária</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {selectedAccount && (
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button asChild disabled={loading}>
                  <span>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Importar Extrato (OFX ou CSV)
                  </span>
                </Button>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".ofx,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">Total de Transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats.reconciled_count}</div>
              <p className="text-xs text-muted-foreground">Conciliadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{stats.pending_count}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{formatCurrency(stats.total_credits)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Créditos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.total_debits)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Débitos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedAccount && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  Pendentes ({pendingTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="reconciled">
                  Conciliadas ({reconciledTransactions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p>Todas as transações foram conciliadas!</p>
                  </div>
                ) : (
                  pendingTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="h-5 w-5 text-success flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                            {transaction.document_number && ` • Doc: ${transaction.document_number}`}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenMatchDialog(transaction)}
                        className="ml-4 flex-shrink-0"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Conciliar
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="reconciled" className="space-y-4 mt-4">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reconciledTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma transação conciliada neste período</p>
                  </div>
                ) : (
                  reconciledTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-success/5 border-success/20"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{transaction.description}</span>
                            <Badge className="bg-success text-success-foreground">Conciliada</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                            {transaction.reconciled_at && ` • Conciliada em ${format(new Date(transaction.reconciled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnreconcile(transaction.id)}
                        className="ml-4 flex-shrink-0"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Desfazer
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedTransaction && (
        <ReconciliationMatchDialog
          transaction={selectedTransaction}
          open={showMatchDialog}
          onOpenChange={setShowMatchDialog}
          onSuccess={() => {
            setShowMatchDialog(false);
            setSelectedTransaction(null);
            loadTransactions();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
