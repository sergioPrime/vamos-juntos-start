import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinancialCharges, FinancialConfig } from '@/hooks/useFinancialCharges';
import { Loader2, Settings, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FinancialConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialConfigDialog({ open, onOpenChange }: FinancialConfigDialogProps) {
  const { getFinancialConfig, updateFinancialConfig, loading } = useFinancialCharges();
  
  const [config, setConfig] = useState<FinancialConfig>({
    late_fee_percentage: 2.00,
    daily_interest_percentage: 0.033,
    early_discount_percentage: 0.00,
    early_discount_days: 0
  });

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    const data = await getFinancialConfig();
    if (data) {
      setConfig(data);
    }
  };

  const handleSave = async () => {
    const success = await updateFinancialConfig(config);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Financeiras
          </DialogTitle>
          <DialogDescription>
            Configure os percentuais de juros, multas e descontos aplicados automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-destructive" />
                Encargos por Atraso
              </CardTitle>
              <CardDescription>
                Valores aplicados quando o pagamento é realizado após o vencimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="late-fee">Multa por Atraso (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="late-fee"
                    type="number"
                    step="0.01"
                    value={config.late_fee_percentage}
                    onChange={(e) => setConfig({ ...config, late_fee_percentage: parseFloat(e.target.value) || 0 })}
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplo: 2% aplicado uma única vez sobre o valor original
                </p>
              </div>

              <div>
                <Label htmlFor="daily-interest">Juros ao Dia (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="daily-interest"
                    type="number"
                    step="0.001"
                    value={config.daily_interest_percentage}
                    onChange={(e) => setConfig({ ...config, daily_interest_percentage: parseFloat(e.target.value) || 0 })}
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplo: 0,033% ao dia = 1% ao mês (multiplicado pelos dias de atraso)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-success" />
                Descontos por Antecipação
              </CardTitle>
              <CardDescription>
                Valores aplicados quando o pagamento é realizado antes do vencimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="early-discount">Percentual de Desconto (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="early-discount"
                    type="number"
                    step="0.01"
                    value={config.early_discount_percentage}
                    onChange={(e) => setConfig({ ...config, early_discount_percentage: parseFloat(e.target.value) || 0 })}
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplo: 2% de desconto sobre o valor original
                </p>
              </div>

              <div>
                <Label htmlFor="discount-days">Prazo para Desconto (dias)</Label>
                <Input
                  id="discount-days"
                  type="number"
                  value={config.early_discount_days}
                  onChange={(e) => setConfig({ ...config, early_discount_days: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplo: Desconto válido se pagar até 5 dias antes do vencimento
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> Estas configurações serão aplicadas automaticamente a todas as novas parcelas. 
              Parcelas já existentes manterão as configurações do momento de sua criação.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
