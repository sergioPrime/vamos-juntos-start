import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInstallments } from '@/hooks/useInstallments';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GenerateInstallmentsDialogProps {
  entryId: string;
  totalAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GenerateInstallmentsDialog({ 
  entryId,
  totalAmount,
  open, 
  onOpenChange,
  onSuccess 
}: GenerateInstallmentsDialogProps) {
  const { generateInstallments, loading } = useInstallments();
  
  const [numInstallments, setNumInstallments] = useState<string>('1');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    const success = await generateInstallments({
      entryId,
      numInstallments: parseInt(numInstallments),
      firstDueDate,
      totalAmount
    });

    if (success) {
      onSuccess?.();
      onOpenChange(false);
      setNumInstallments('1');
      setFirstDueDate(new Date().toISOString().split('T')[0]);
    }
  };

  const installmentValue = totalAmount / (parseInt(numInstallments) || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerar Parcelas
          </DialogTitle>
          <DialogDescription>
            Configure o parcelamento para este lançamento financeiro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Valor Total:</strong> {formatCurrency(totalAmount)}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="num-installments">Número de Parcelas</Label>
            <Input
              id="num-installments"
              type="number"
              min="1"
              max="999"
              value={numInstallments}
              onChange={(e) => setNumInstallments(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="first-due-date">Data do Primeiro Vencimento</Label>
            <Input
              id="first-due-date"
              type="date"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              As demais parcelas vencerão mensalmente após esta data
            </p>
          </div>

          {parseInt(numInstallments) > 0 && (
            <Alert className="bg-accent">
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Resumo do Parcelamento:</div>
                  <div className="text-sm">
                    • {numInstallments}x de {formatCurrency(installmentValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    * A última parcela pode ter ajuste de centavos
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !numInstallments || parseInt(numInstallments) < 1}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Parcelas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
