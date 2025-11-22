import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useFinancialCharges } from '@/hooks/useFinancialCharges';
import { formatCurrency } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BatchSettleDialogProps {
  installmentIds: string[];
  installments: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BatchSettleDialog({
  installmentIds,
  installments,
  open,
  onOpenChange,
  onSuccess
}: BatchSettleDialogProps) {
  const { paymentMethods } = usePaymentMethods();
  const { accounts: bankAccounts } = useBankAccounts();
  const { settleWithCharges } = useFinancialCharges();

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ id: string; success: boolean; error?: string }[]>([]);

  const totalAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const handleBatchSettle = async () => {
    setProcessing(true);
    setResults([]);

    const newResults: typeof results = [];

    for (const installmentId of installmentIds) {
      try {
        const result = await settleWithCharges(
          installmentId,
          paymentDate,
          paymentMethodId || undefined,
          bankAccountId || undefined
        );

        newResults.push({
          id: installmentId,
          success: !!result?.success,
          error: result?.success ? undefined : 'Erro ao quitar parcela'
        });
      } catch (error: any) {
        newResults.push({
          id: installmentId,
          success: false,
          error: error.message || 'Erro desconhecido'
        });
      }
    }

    setResults(newResults);
    setProcessing(false);

    const successCount = newResults.filter(r => r.success).length;
    const errorCount = newResults.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`${successCount} parcela(s) quitada(s) com sucesso`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} parcela(s) com erro ao quitar`);
    }

    if (successCount === newResults.length) {
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    }
  };

  const isProcessed = results.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Baixa em Lote de Parcelas</DialogTitle>
          <DialogDescription>
            Quitar {installmentIds.length} parcela(s) simultaneamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-accent/50">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Parcelas</span>
                <span className="font-semibold">{installmentIds.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total (Aproximado)</span>
                <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </Card>

          {!isProcessed && (
            <>
              <div>
                <Label htmlFor="batch-payment-date">Data do Pagamento</Label>
                <Input
                  id="batch-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={processing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batch-payment-method">Forma de Pagamento</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={processing}>
                    <SelectTrigger id="batch-payment-method">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="batch-bank-account">Conta Bancária</Label>
                  <Select value={bankAccountId} onValueChange={setBankAccountId} disabled={processing}>
                    <SelectTrigger id="batch-bank-account">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Juros, multas e descontos serão calculados automaticamente para cada parcela com base na data de pagamento informada.
                </AlertDescription>
              </Alert>
            </>
          )}

          {processing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Processando parcelas...</span>
            </div>
          )}

          {isProcessed && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2">Resultado do Processamento:</h4>
              {results.map((result, index) => {
                const installment = installments.find(i => i.id === result.id);
                return (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-success/10 border-success/20' 
                        : 'bg-destructive/10 border-destructive/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <div className="font-medium">
                          Parcela {installment?.installment_number}/{installment?.total_installments}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(installment?.amount || 0)}
                        </div>
                      </div>
                    </div>
                    {!result.success && result.error && (
                      <span className="text-xs text-destructive">{result.error}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isProcessed ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                Cancelar
              </Button>
              <Button onClick={handleBatchSettle} disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Baixa em Lote
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
