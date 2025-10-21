import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinancialCharges, OverdueInstallment } from '@/hooks/useFinancialCharges';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { SettleInstallmentDialog } from './SettleInstallmentDialog';

export function OverdueInstallmentsPanel() {
  const { getOverdueInstallments, loading } = useFinancialCharges();
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);

  useEffect(() => {
    loadOverdueInstallments();
  }, []);

  const loadOverdueInstallments = async () => {
    const data = await getOverdueInstallments();
    setOverdueInstallments(data);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (overdueInstallments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-success mb-4" />
          <p className="text-muted-foreground">Nenhuma parcela vencida! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  const totalOverdue = overdueInstallments.reduce((sum, inst) => sum + inst.final_amount, 0);
  const totalCharges = overdueInstallments.reduce((sum, inst) => 
    sum + inst.late_fee + inst.interest_amount, 0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Parcelas Vencidas
              </CardTitle>
              <CardDescription>
                {overdueInstallments.length} parcela(s) em atraso
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalOverdue)}
              </div>
              <div className="text-sm text-muted-foreground">
                +{formatCurrency(totalCharges)} em encargos
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueInstallments.map((installment) => (
              <div
                key={installment.installment_id}
                className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{installment.person_name}</span>
                    <Badge variant="destructive" className="text-xs">
                      {installment.days_overdue} dias de atraso
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Parcela {installment.installment_number}/{installment.total_installments}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Vencimento:</span>
                      <div className="font-medium">
                        {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Original:</span>
                      <div className="font-medium">{formatCurrency(installment.original_amount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Encargos:</span>
                      <div className="font-medium text-destructive">
                        +{formatCurrency(installment.late_fee + installment.interest_amount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-bold text-lg">{formatCurrency(installment.final_amount)}</div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedInstallment(installment.installment_id)}
                  className="ml-4"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedInstallment && (
        <SettleInstallmentDialog
          installmentId={selectedInstallment}
          open={!!selectedInstallment}
          onOpenChange={(open) => !open && setSelectedInstallment(null)}
          onSuccess={() => {
            setSelectedInstallment(null);
            loadOverdueInstallments();
          }}
        />
      )}
    </>
  );
}
