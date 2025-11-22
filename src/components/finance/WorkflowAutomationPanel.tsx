import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFinancialWorkflows } from '@/hooks/useFinancialWorkflows';
import { 
  Zap, 
  Bell, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function WorkflowAutomationPanel() {
  const {
    loading,
    processOverdueNotifications,
    autoReconcileTransactions,
    generatePaymentReminders,
    syncOrdersToFinancial,
    calculateCashPosition
  } = useFinancialWorkflows();

  const [cashPosition, setCashPosition] = useState<any>(null);
  const [automationStats, setAutomationStats] = useState({
    overdue_notifications: 0,
    reconciled_transactions: 0,
    payment_reminders: 0,
    synced_orders: 0
  });

  const [automationEnabled, setAutomationEnabled] = useState({
    overdue_notifications: true,
    auto_reconciliation: true,
    payment_reminders: true,
    order_sync: true
  });

  useEffect(() => {
    loadCashPosition();
  }, []);

  const loadCashPosition = async () => {
    const position = await calculateCashPosition();
    setCashPosition(position);
  };

  const handleProcessOverdue = async () => {
    const count = await processOverdueNotifications();
    setAutomationStats(prev => ({ ...prev, overdue_notifications: count }));
    toast.success(`${count} notificação(ões) processada(s)`);
  };

  const handleAutoReconcile = async () => {
    const result = await autoReconcileTransactions();
    setAutomationStats(prev => ({ 
      ...prev, 
      reconciled_transactions: result.reconciled 
    }));
  };

  const handleGenerateReminders = async () => {
    const reminders = await generatePaymentReminders(3);
    setAutomationStats(prev => ({ 
      ...prev, 
      payment_reminders: reminders.length 
    }));
    if (reminders.length > 0) {
      toast.success(`${reminders.length} lembrete(s) gerado(s)`);
    }
  };

  const handleSyncOrders = async () => {
    const result = await syncOrdersToFinancial();
    setAutomationStats(prev => ({ 
      ...prev, 
      synced_orders: result.synced 
    }));
  };

  const handleRunAllWorkflows = async () => {
    toast.info('Executando todos os workflows...');
    
    await Promise.all([
      automationEnabled.overdue_notifications && handleProcessOverdue(),
      automationEnabled.auto_reconciliation && handleAutoReconcile(),
      automationEnabled.payment_reminders && handleGenerateReminders(),
      automationEnabled.order_sync && handleSyncOrders()
    ]);

    await loadCashPosition();
    toast.success('Workflows executados com sucesso!');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Posição de Caixa */}
      {cashPosition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Posição de Caixa em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Saldo em Bancos</p>
                <p className="text-2xl font-bold">{formatCurrency(cashPosition.bank_balance)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-success">
                  +{formatCurrency(cashPosition.receivables)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-2xl font-bold text-destructive">
                  -{formatCurrency(cashPosition.payables)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Posição Líquida</p>
                <p className={`text-2xl font-bold ${cashPosition.net_position >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(cashPosition.net_position)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Índice de Liquidez</span>
                <Badge variant={cashPosition.liquidity_ratio >= 1 ? 'default' : 'destructive'}>
                  {cashPosition.liquidity_ratio.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cashPosition.liquidity_ratio >= 1 
                  ? 'Posição saudável - recursos suficientes para cobrir obrigações'
                  : 'Atenção - recursos insuficientes para cobrir todas as obrigações'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows Automáticos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automações Financeiras
            </CardTitle>
            <Button onClick={handleRunAllWorkflows} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Executar Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notificações de Atraso */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-full p-2 bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Notificações de Atraso</h3>
                  <Badge variant="secondary">{automationStats.overdue_notifications}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Notifica automaticamente sobre parcelas vencidas
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={automationEnabled.overdue_notifications}
                    onCheckedChange={(checked) => 
                      setAutomationEnabled(prev => ({ ...prev, overdue_notifications: checked }))
                    }
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleProcessOverdue}
              disabled={loading || !automationEnabled.overdue_notifications}
            >
              Executar
            </Button>
          </div>

          {/* Reconciliação Automática */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-full p-2 bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Reconciliação Automática</h3>
                  <Badge variant="secondary">{automationStats.reconciled_transactions}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reconcilia transações bancárias com lançamentos financeiros
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={automationEnabled.auto_reconciliation}
                    onCheckedChange={(checked) => 
                      setAutomationEnabled(prev => ({ ...prev, auto_reconciliation: checked }))
                    }
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAutoReconcile}
              disabled={loading || !automationEnabled.auto_reconciliation}
            >
              Executar
            </Button>
          </div>

          {/* Lembretes de Pagamento */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-full p-2 bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Lembretes de Pagamento</h3>
                  <Badge variant="secondary">{automationStats.payment_reminders}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Gera lembretes 3 dias antes do vencimento
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={automationEnabled.payment_reminders}
                    onCheckedChange={(checked) => 
                      setAutomationEnabled(prev => ({ ...prev, payment_reminders: checked }))
                    }
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateReminders}
              disabled={loading || !automationEnabled.payment_reminders}
            >
              Executar
            </Button>
          </div>

          {/* Sincronização de Pedidos */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-full p-2 bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Sincronização de Pedidos</h3>
                  <Badge variant="secondary">{automationStats.synced_orders}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cria lançamentos financeiros automaticamente de pedidos pagos
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={automationEnabled.order_sync}
                    onCheckedChange={(checked) => 
                      setAutomationEnabled(prev => ({ ...prev, order_sync: checked }))
                    }
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncOrders}
              disabled={loading || !automationEnabled.order_sync}
            >
              Executar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Automações Inteligentes</p>
              <p className="text-sm text-muted-foreground">
                Os workflows são executados automaticamente em segundo plano para manter seus dados sempre atualizados.
                Você pode executá-los manualmente a qualquer momento ou configurar a frequência de execução.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
