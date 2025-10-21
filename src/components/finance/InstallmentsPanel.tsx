import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInstallments } from '@/hooks/useInstallments';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { SettleInstallmentDialog } from './SettleInstallmentDialog';
import { toast } from 'sonner';

interface InstallmentsPanelProps {
  entryId: string;
}

export function InstallmentsPanel({ entryId }: InstallmentsPanelProps) {
  const { installments, loading, loadInstallments, unsettleInstallment } = useInstallments();
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);

  useEffect(() => {
    loadInstallments(entryId);
  }, [entryId]);

  const handleUnsettle = async (installmentId: string) => {
    const success = await unsettleInstallment(installmentId);
    if (success) {
      loadInstallments(entryId);
    }
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

  if (installments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma parcela cadastrada para este lançamento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
          <CardDescription>
            {installments.filter(i => i.is_settled).length} de {installments.length} parcelas quitadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {installments.map((installment) => {
              const isOverdue = !installment.is_settled && new Date(installment.due_date) < new Date();
              const daysLate = isOverdue 
                ? Math.floor((new Date().getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <div
                  key={installment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {installment.is_settled ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-warning'}`} />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          Parcela {installment.installment_number}/{installment.total_installments}
                        </span>
                        {installment.is_settled && (
                          <Badge className="text-xs bg-success text-success-foreground">Quitada</Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Vencida há {daysLate} dias
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Vencimento: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {installment.is_settled && installment.settled_at && (
                          <span>
                            Pago em: {format(new Date(installment.settled_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatCurrency(installment.is_settled && installment.settled_amount 
                          ? installment.settled_amount 
                          : installment.amount
                        )}
                      </div>
                      {installment.is_settled && installment.settled_amount && installment.settled_amount !== installment.amount && (
                        <div className="text-xs text-muted-foreground">
                          Original: {formatCurrency(installment.amount)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {installment.is_settled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsettle(installment.id)}
                      >
                        Cancelar Quitação
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedInstallment(installment.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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
            loadInstallments(entryId);
          }}
        />
      )}
    </>
  );
}
