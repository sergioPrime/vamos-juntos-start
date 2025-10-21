import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialCharges } from '@/hooks/useFinancialCharges';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { formatCurrency } from '@/lib/utils';
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface SettleInstallmentDialogProps {
  installmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SettleInstallmentDialog({ 
  installmentId, 
  open, 
  onOpenChange,
  onSuccess 
}: SettleInstallmentDialogProps) {
  const { simulatePayment, settleWithCharges, loading } = useFinancialCharges();
  const { paymentMethods, loading: loadingMethods } = usePaymentMethods();
  const { accounts: bankAccounts, loading: loadingAccounts } = useBankAccounts();
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [simulation, setSimulation] = useState<any>(null);

  useEffect(() => {
    if (open && installmentId) {
      loadSimulation();
    }
  }, [open, installmentId, paymentDate]);

  const loadSimulation = async () => {
    const result = await simulatePayment(installmentId, paymentDate);
    setSimulation(result);
  };

  const handleSettle = async () => {
    const amount = customAmount ? parseFloat(customAmount) : undefined;
    const result = await settleWithCharges(
      installmentId,
      paymentDate,
      paymentMethodId || undefined,
      bankAccountId || undefined,
      amount
    );

    if (result?.success) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  const isOverdue = simulation && simulation.days_late > 0;
  const isEarly = simulation && simulation.days_early > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quitar Parcela</DialogTitle>
          <DialogDescription>
            Simule e confirme o pagamento da parcela com encargos calculados automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="payment-date">Data do Pagamento</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {simulation && (
            <Card className="p-4 bg-accent/50">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Original</span>
                  <span className="font-medium">{formatCurrency(simulation.original_amount)}</span>
                </div>

                {simulation.late_fee > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Multa por Atraso ({simulation.days_late} dias)
                    </span>
                    <span className="font-medium">+{formatCurrency(simulation.late_fee)}</span>
                  </div>
                )}

                {simulation.interest_amount > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Juros
                    </span>
                    <span className="font-medium">+{formatCurrency(simulation.interest_amount)}</span>
                  </div>
                )}

                {simulation.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-success">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Desconto por Antecipação ({simulation.days_early} dias)
                    </span>
                    <span className="font-medium">-{formatCurrency(simulation.discount_amount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor Final</span>
                    <span className="text-xl font-bold">{formatCurrency(simulation.final_amount)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {isOverdue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta parcela está vencida há {simulation.days_late} dias. Encargos foram aplicados automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {isEarly && (
            <Alert className="border-success bg-success/10">
              <AlertCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Pagamento antecipado! Desconto aplicado por pagar {simulation.days_early} dias antes do vencimento.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-method">Forma de Pagamento</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger id="payment-method">
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
              <Label htmlFor="bank-account">Conta Bancária</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="bank-account">
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

          <div>
            <Label htmlFor="custom-amount">Valor Customizado (opcional)</Label>
            <Input
              id="custom-amount"
              type="number"
              step="0.01"
              placeholder={simulation ? formatCurrency(simulation.final_amount) : '0,00'}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco para usar o valor calculado automaticamente
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSettle} disabled={loading || !simulation}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Quitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
