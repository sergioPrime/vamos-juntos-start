import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useBankReconciliation, BankTransaction, ReconciliationMatch } from '@/hooks/useBankReconciliation';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReconciliationMatchDialogProps {
  transaction: BankTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReconciliationMatchDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess
}: ReconciliationMatchDialogProps) {
  const { findMatches, reconcileTransaction, loading } = useBankReconciliation();
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (open && transaction) {
      loadMatches();
    }
  }, [open, transaction]);

  const loadMatches = async () => {
    setLoadingMatches(true);
    const results = await findMatches(transaction.id, transaction);
    setMatches(results);
    setLoadingMatches(false);
  };

  const handleReconcile = async () => {
    if (!selectedEntry) return;

    const success = await reconcileTransaction(transaction.id, selectedEntry);
    if (success) {
      onSuccess?.();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 50) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Conciliação Inteligente
          </DialogTitle>
          <DialogDescription>
            Encontramos lançamentos que podem corresponder a esta transação bancária
          </DialogDescription>
        </DialogHeader>

        <Card className="p-4 bg-accent/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {transaction.type === 'credit' ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                  {transaction.document_number && ` • Doc: ${transaction.document_number}`}
                </div>
              </div>
            </div>
            <div className={`text-xl font-bold ${
              transaction.type === 'credit' ? 'text-success' : 'text-destructive'
            }`}>
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {loadingMatches ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Buscando correspondências...</span>
            </div>
          ) : matches.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma correspondência automática encontrada. Você pode criar um lançamento manual.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{matches.length} correspondência(s) encontrada(s)</span>
              </div>

              {matches.map((match) => {
                const entry = match.suggestedEntry;
                const personName = entry.pessoas?.nome_fantasia || 'N/A';

                return (
                  <Card
                    key={entry.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedEntry === entry.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedEntry(entry.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{personName}</span>
                          <Badge variant={getScoreBadge(match.matchScore)}>
                            <span className={getScoreColor(match.matchScore)}>
                              {match.matchScore}% de compatibilidade
                            </span>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(entry.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Venc: {format(new Date(entry.due_date), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {match.matchReasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleReconcile}
            disabled={!selectedEntry || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirmar Conciliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
