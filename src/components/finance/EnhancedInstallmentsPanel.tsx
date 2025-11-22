import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useInstallmentsPaginated, InstallmentFilters } from '@/hooks/useInstallmentsPaginated';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import { SettleInstallmentDialog } from './SettleInstallmentDialog';
import { BatchSettleDialog } from './BatchSettleDialog';
import { InstallmentsFilters } from './InstallmentsFilters';

interface EnhancedInstallmentsPanelProps {
  entryId?: string;
}

export function EnhancedInstallmentsPanel({ entryId }: EnhancedInstallmentsPanelProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InstallmentFilters>({
    status: 'all',
    entryId: entryId
  });
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const { data, isLoading, refetch } = useInstallmentsPaginated(filters, page, 20);

  const handleResetFilters = () => {
    setFilters({ status: 'all', entryId: entryId });
    setPage(1);
  };

  const toggleSelectInstallment = (id: string) => {
    setSelectedForBatch(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    const pendingIds = (data?.data || [])
      .filter(i => !i.is_settled)
      .map(i => i.id);
    setSelectedForBatch(pendingIds);
  };

  const clearSelection = () => {
    setSelectedForBatch([]);
  };

  const handleBatchSettle = () => {
    if (selectedForBatch.length === 0) return;
    setShowBatchDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const installments = data?.data || [];
  const selectedInstallments = installments.filter(i => selectedForBatch.includes(i.id));

  return (
    <div className="space-y-4">
      <InstallmentsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parcelas</CardTitle>
              <CardDescription>
                {data?.total || 0} parcela(s) encontrada(s)
              </CardDescription>
            </div>
            {selectedForBatch.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedForBatch.length} selecionada(s)
                </Badge>
                <Button
                  size="sm"
                  onClick={handleBatchSettle}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Baixa em Lote
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                >
                  Limpar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {installments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPending}
                  disabled={installments.filter(i => !i.is_settled).length === 0}
                >
                  Selecionar Todas Pendentes
                </Button>
              </div>

              <div className="space-y-3">
                {installments.map((installment) => {
                  const isOverdue = !installment.is_settled && new Date(installment.due_date) < new Date();
                  const daysLate = isOverdue 
                    ? Math.floor((new Date().getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  const personName = installment.financial_entries?.pessoas?.nome_fantasia || 'N/A';

                  return (
                    <div
                      key={installment.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      {!installment.is_settled && (
                        <Checkbox
                          checked={selectedForBatch.includes(installment.id)}
                          onCheckedChange={() => toggleSelectInstallment(installment.id)}
                        />
                      )}

                      <div className="flex items-center gap-4 flex-1">
                        {installment.is_settled ? (
                          <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className={`h-5 w-5 flex-shrink-0 ${isOverdue ? 'text-destructive' : 'text-warning'}`} />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">
                              Parcela {installment.installment_number}/{installment.total_installments}
                            </span>
                            <span className="text-sm text-muted-foreground truncate">
                              {personName}
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

                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-lg">
                            {formatCurrency(installment.is_settled && installment.settled_amount 
                              ? installment.settled_amount 
                              : installment.amount
                            )}
                          </div>
                        </div>
                      </div>

                      {!installment.is_settled && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedInstallment(installment.id)}
                          className="flex-shrink-0"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Quitar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {data.page} de {data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedInstallment && (
        <SettleInstallmentDialog
          installmentId={selectedInstallment}
          open={!!selectedInstallment}
          onOpenChange={(open) => !open && setSelectedInstallment(null)}
          onSuccess={() => {
            setSelectedInstallment(null);
            refetch();
          }}
        />
      )}

      {showBatchDialog && (
        <BatchSettleDialog
          installmentIds={selectedForBatch}
          installments={selectedInstallments}
          open={showBatchDialog}
          onOpenChange={setShowBatchDialog}
          onSuccess={() => {
            setShowBatchDialog(false);
            setSelectedForBatch([]);
            refetch();
          }}
        />
      )}
    </div>
  );
}
