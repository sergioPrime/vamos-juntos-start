import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'due_date' | 'overdue' | 'payment' | 'installment';
  condition: {
    days_before?: number;
    days_after?: number;
    amount_threshold?: number;
  };
  actions: WorkflowAction[];
  is_active: boolean;
}

export interface WorkflowAction {
  type: 'email' | 'notification' | 'status_change' | 'create_task';
  config: any;
}

export function useFinancialWorkflows() {
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);

  const processOverdueNotifications = useCallback(async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      // Buscar parcelas vencidas
      const today = new Date().toISOString().split('T')[0];
      
      const { data: overdueInstallments, error } = await supabase
        .from('financial_entry_installments')
        .select(`
          id,
          amount,
          due_date,
          installment_number,
          entry:financial_entries!inner(
            id,
            description,
            person_id,
            entry_type,
            org_id
          )
        `)
        .eq('entry.org_id', currentOrg.id)
        .eq('is_settled', false)
        .lt('due_date', today);

      if (error) throw error;

      // Criar notificações para parcelas vencidas
      const notifications = [];
      
      for (const inst of overdueInstallments || []) {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Notificar apenas em marcos específicos (1, 3, 7, 15, 30 dias)
        if ([1, 3, 7, 15, 30].includes(daysOverdue)) {
          notifications.push({
            org_id: currentOrg.id,
            type: 'overdue_payment',
            title: `Parcela vencida há ${daysOverdue} dia(s)`,
            message: `Parcela ${inst.installment_number} de ${inst.entry.description} - ${inst.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            reference_type: 'installment',
            reference_id: inst.id,
            severity: daysOverdue > 15 ? 'high' : 'medium'
          });
        }
      }

      console.log(`Processadas ${notifications.length} notificações de atraso`);
      return notifications.length;
    } catch (error: any) {
      console.error('Erro ao processar notificações de atraso:', error);
      toast.error('Erro ao processar notificações');
      return 0;
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const autoReconcileTransactions = useCallback(async () => {
    if (!currentOrg?.id) return { reconciled: 0, pending: 0 };

    setLoading(true);
    try {
      // Buscar transações bancárias não conciliadas
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('id, amount, transaction_date, description')
        .eq('org_id', currentOrg.id)
        .limit(100);

      if (txError) throw txError;

      let reconciledCount = 0;

      // Tentar reconciliar cada transação
      for (const tx of transactions || []) {
        // Buscar lançamento com valor e data próximos
        const { data: entries } = await supabase
          .from('financial_entries')
          .select('id, amount, due_date')
          .eq('org_id', currentOrg.id)
          .eq('is_settled', false)
          .gte('amount', tx.amount * 0.95)
          .lte('amount', tx.amount * 1.05)
          .gte('due_date', new Date(new Date(tx.transaction_date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lte('due_date', new Date(new Date(tx.transaction_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .limit(1);

        if (entries && entries.length > 0) {
          // Marcar lançamento como quitado
          const { error: updateError } = await supabase
            .from('financial_entries')
            .update({ 
              is_settled: true,
              settled_at: new Date().toISOString()
            })
            .eq('id', entries[0].id);

          if (!updateError) {
            reconciledCount++;
          }
        }
      }

      const pendingCount = (transactions?.length || 0) - reconciledCount;
      
      if (reconciledCount > 0) {
        toast.success(`${reconciledCount} transação(ões) reconciliada(s) automaticamente`);
      }

      return { reconciled: reconciledCount, pending: pendingCount };
    } catch (error: any) {
      console.error('Erro na reconciliação automática:', error);
      toast.error('Erro na reconciliação automática');
      return { reconciled: 0, pending: 0 };
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const generatePaymentReminders = useCallback(async (daysBeforeDue: number = 3) => {
    if (!currentOrg?.id) return [];

    setLoading(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBeforeDue);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const { data: upcomingInstallments, error } = await supabase
        .from('financial_entry_installments')
        .select(`
          id,
          amount,
          due_date,
          installment_number,
          entry:financial_entries!inner(
            id,
            description,
            person_id,
            entry_type,
            org_id
          )
        `)
        .eq('entry.org_id', currentOrg.id)
        .eq('is_settled', false)
        .eq('due_date', targetDateStr);

      if (error) throw error;

      const reminders = (upcomingInstallments || []).map(inst => ({
        type: 'payment_reminder',
        installment_id: inst.id,
        due_date: inst.due_date,
        amount: inst.amount,
        description: inst.entry.description,
        days_until_due: daysBeforeDue
      }));

      console.log(`Gerados ${reminders.length} lembretes de pagamento`);
      return reminders;
    } catch (error: any) {
      console.error('Erro ao gerar lembretes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const syncOrdersToFinancial = useCallback(async () => {
    if (!currentOrg?.id) return { synced: 0, errors: 0 };

    setLoading(true);
    try {
      // Buscar pedidos pagos sem lançamento financeiro
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_id, order_date, owner_id')
        .eq('org_id', currentOrg.id)
        .eq('payment_status', 'paid')
        .limit(50);

      if (ordersError) throw ordersError;

      let syncedCount = 0;
      let errorCount = 0;

      for (const order of orders || []) {
        // Verificar se já existe lançamento
        const { data: existingEntry } = await supabase
          .from('financial_entries')
          .select('id')
          .eq('org_id', currentOrg.id)
          .eq('origin_type', 'order')
          .eq('origin_id', order.id)
          .maybeSingle();

        if (!existingEntry) {
          // Criar lançamento financeiro
          const { error: insertError } = await supabase
            .from('financial_entries')
            .insert({
              org_id: currentOrg.id,
              entry_type: 'receivable',
              person_type: 'customer',
              person_id: order.customer_id,
              amount: order.total_amount,
              description: `Recebimento - Pedido #${order.order_number}`,
              competence_date: order.order_date,
              due_date: order.order_date,
              origin_type: 'order',
              origin_id: order.id,
              is_settled: true,
              settled_at: new Date().toISOString(),
              created_by: order.owner_id
            });

          if (insertError) {
            errorCount++;
          } else {
            syncedCount++;
          }
        }
      }

      if (syncedCount > 0) {
        toast.success(`${syncedCount} pedido(s) sincronizado(s) com financeiro`);
      }

      return { synced: syncedCount, errors: errorCount };
    } catch (error: any) {
      console.error('Erro na sincronização de pedidos:', error);
      toast.error('Erro na sincronização');
      return { synced: 0, errors: 0 };
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const calculateCashPosition = useCallback(async () => {
    if (!currentOrg?.id) return null;

    try {
      // Saldo em bancos
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true);

      const bankBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

      // Contas a receber
      const { data: receivables } = await supabase
        .from('financial_entry_installments')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('is_settled', false);

      const totalReceivables = receivables?.reduce((sum, r) => sum + r.amount, 0) || 0;

      // Contas a pagar
      const { data: payables } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'payable')
        .eq('is_settled', false);

      const totalPayables = payables?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        bank_balance: bankBalance,
        receivables: totalReceivables,
        payables: totalPayables,
        net_position: bankBalance + totalReceivables - totalPayables,
        liquidity_ratio: totalPayables > 0 ? (bankBalance + totalReceivables) / totalPayables : 0
      };
    } catch (error: any) {
      console.error('Erro ao calcular posição de caixa:', error);
      return null;
    }
  }, [currentOrg?.id]);

  return {
    loading,
    processOverdueNotifications,
    autoReconcileTransactions,
    generatePaymentReminders,
    syncOrdersToFinancial,
    calculateCashPosition
  };
}
