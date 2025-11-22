import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankReconciliation } from '@/hooks/useBankReconciliation';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Upload,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function EnhancedBankReconciliation() {
  const { accounts } = useBankAccounts();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  const {
    loading,
    bankTransactions,
    unmatchedEntries,
    matchTransaction,
    unmatchTransaction,
    importOFX,
    importCSV,
    getStats
  } = useBankReconciliation(selectedAccount);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAccount) return;

    const fileName = file.name.toLowerCase();
    let success = false;

    if (fileName.endsWith('.ofx')) {
      success = await importOFX(file);
    } else if (fileName.endsWith('.csv')) {
      success = await importCSV(file);
    } else {
      toast.error('Formato não suportado. Use arquivos OFX ou CSV');
    }

    // Clear input
    event.target.value = '';
  };

  const stats = selectedAccount ? getStats() : null;
  const pendingTransactions = bankTransactions.filter(t => !t.matched);
  const matchedTransactions = bankTransactions.filter(t => t.matched);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conciliação Bancária Avançada</CardTitle>
          <CardDescription>
            Importe extratos bancários e concilie automaticamente com seus lançamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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

            {selectedAccount && (
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild disabled={loading}>
                    <span>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Importar Extrato (OFX/CSV)
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
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats.matched_count}</div>
              <p className="text-xs text-muted-foreground">Conciliadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{stats.unmatched_count}</div>
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
                <TabsTrigger value="matched">
                  Conciliadas ({matchedTransactions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {loading ? (
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
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
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

                      <div className="ml-4 flex-shrink-0">
                        {unmatchedEntries.length > 0 && (
                          <Select
                            onValueChange={(entryId) => matchTransaction(transaction.id, entryId)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Conciliar com..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unmatchedEntries
                                .filter(e =>
                                  (e.entry_type === 'receivable' && transaction.type === 'credit') ||
                                  (e.entry_type === 'payable' && transaction.type === 'debit')
                                )
                                .map((entry) => (
                                  <SelectItem key={entry.id} value={entry.id}>
                                    {entry.description} - {formatCurrency(entry.amount)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="matched" className="space-y-4 mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : matchedTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma transação conciliada ainda</p>
                  </div>
                ) : (
                  matchedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-success/5 border-success/20"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
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
                        onClick={() => unmatchTransaction(transaction.id)}
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
    </div>
  );
}
