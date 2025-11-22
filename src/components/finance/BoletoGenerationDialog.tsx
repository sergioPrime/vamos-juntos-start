import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBoletos } from '@/hooks/useBoletos';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { FileText, Loader2 } from 'lucide-react';

interface BoletoGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  installmentId?: string;
  amount: number;
  dueDate: string;
  personId: string;
  personName: string;
}

export function BoletoGenerationDialog({
  open,
  onOpenChange,
  entryId,
  installmentId,
  amount,
  dueDate,
  personId,
  personName
}: BoletoGenerationDialogProps) {
  const { generateBoleto, loading } = useBoletos();
  const { bankAccounts, loadBankAccounts } = useBankAccounts();
  
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [lateFee, setLateFee] = useState<number>(2.0);
  const [interest, setInterest] = useState<number>(0.033);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      loadBankAccounts();
    }
  }, [open, loadBankAccounts]);

  const handleGenerate = async () => {
    const success = await generateBoleto({
      entry_id: entryId,
      installment_id: installmentId,
      amount,
      due_date: dueDate,
      person_id: personId,
      bank_account_id: selectedBankAccount || undefined,
      late_fee: lateFee,
      interest,
      discount
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Boleto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Informações do Cliente</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{personName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">
                  {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimento:</span>
                <span className="font-medium">
                  {new Date(dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Configurações do Boleto */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-account">Conta Bancária</Label>
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - Ag: {account.agency} - Conta: {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="late-fee">Multa (%)</Label>
                <Input
                  id="late-fee"
                  type="number"
                  step="0.01"
                  value={lateFee}
                  onChange={(e) => setLateFee(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Juros (% ao dia)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.001"
                  value={interest}
                  onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Preview dos Encargos */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Simulação de Encargos (após vencimento)</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Original:</span>
                <span>{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multa (2%):</span>
                <span className="text-destructive">
                  + {(amount * (lateFee / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Juros (por dia):</span>
                <span className="text-destructive">
                  + {(amount * (interest / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="text-success">
                    - {discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={loading || !selectedBankAccount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Boleto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
