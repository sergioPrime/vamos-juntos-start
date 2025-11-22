import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface CashFlowScenario {
  date: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  confirmed_inflow: number;
  confirmed_outflow: number;
}

export interface CashFlowAlert {
  id: string;
  type: 'negative_balance' | 'low_balance' | 'high_outflow' | 'trend_decline';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  date: string;
  amount: number;
  dismissed: boolean;
}

export interface CashFlowMetrics {
  current_balance: number;
  projected_30d: number;
  projected_60d: number;
  projected_90d: number;
  avg_daily_inflow: number;
  avg_daily_outflow: number;
  burn_rate: number;
  runway_days: number;
  trend: 'positive' | 'neutral' | 'negative';
}

export function useAdvancedCashFlow(daysAhead: number = 90) {
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<CashFlowScenario[]>([]);
  const [alerts, setAlerts] = useState<CashFlowAlert[]>([]);
  const [metrics, setMetrics] = useState<CashFlowMetrics | null>(null);

  useEffect(() => {
    if (currentOrg?.id) {
      generateAdvancedProjections();
    }
  }, [currentOrg?.id, daysAhead]);

  const generateAdvancedProjections = async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      // 1. Buscar saldo atual
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true);

      const currentBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

      // 2. Buscar lançamentos futuros confirmados
      const { data: futureEntries } = await supabase
        .from('financial_entries')
        .select('due_date, amount, entry_type, is_settled')
        .eq('org_id', currentOrg.id)
        .eq('is_settled', false)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // 3. Calcular médias históricas (últimos 90 dias)
      const { data: historicalTxs } = await supabase
        .from('financial_transactions')
        .select('transaction_date, amount, transaction_type')
        .eq('org_id', currentOrg.id)
        .gte('transaction_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const avgDailyInflow = historicalTxs
        ?.filter(tx => tx.transaction_type === 'inflow')
        .reduce((sum, tx) => sum + tx.amount, 0) / 90 || 0;

      const avgDailyOutflow = historicalTxs
        ?.filter(tx => tx.transaction_type === 'outflow')
        .reduce((sum, tx) => sum + tx.amount, 0) / 90 || 0;

      // 4. Gerar cenários para cada dia
      const projections: CashFlowScenario[] = [];
      let realisticBalance = currentBalance;
      let optimisticBalance = currentBalance;
      let pessimisticBalance = currentBalance;

      for (let i = 0; i < daysAhead; i++) {
        const projDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const dateStr = projDate.toISOString().split('T')[0];

        // Buscar lançamentos confirmados para esta data
        const dayEntries = futureEntries?.filter(e => e.due_date === dateStr) || [];
        const confirmedInflow = dayEntries
          .filter(e => e.entry_type === 'receivable')
          .reduce((sum, e) => sum + e.amount, 0);
        const confirmedOutflow = dayEntries
          .filter(e => e.entry_type === 'payable')
          .reduce((sum, e) => sum + e.amount, 0);

        // Cenário Realista: médias históricas + confirmados
        realisticBalance += confirmedInflow + avgDailyInflow - confirmedOutflow - avgDailyOutflow;

        // Cenário Otimista: 120% das entradas + confirmados, 80% das saídas
        optimisticBalance += confirmedInflow + (avgDailyInflow * 1.2) - confirmedOutflow - (avgDailyOutflow * 0.8);

        // Cenário Pessimista: 70% das entradas + confirmados, 120% das saídas
        pessimisticBalance += confirmedInflow + (avgDailyInflow * 0.7) - confirmedOutflow - (avgDailyOutflow * 1.2);

        projections.push({
          date: dateStr,
          optimistic: Math.round(optimisticBalance * 100) / 100,
          realistic: Math.round(realisticBalance * 100) / 100,
          pessimistic: Math.round(pessimisticBalance * 100) / 100,
          confirmed_inflow: confirmedInflow,
          confirmed_outflow: confirmedOutflow
        });
      }

      setScenarios(projections);

      // 5. Calcular métricas
      const burnRate = avgDailyOutflow - avgDailyInflow;
      const runwayDays = burnRate > 0 ? Math.floor(currentBalance / burnRate) : 999;
      
      const projected30d = projections[29]?.realistic || 0;
      const projected60d = projections[59]?.realistic || 0;
      const projected90d = projections[89]?.realistic || 0;

      let trend: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (projected90d > currentBalance * 1.1) trend = 'positive';
      else if (projected90d < currentBalance * 0.9) trend = 'negative';

      setMetrics({
        current_balance: currentBalance,
        projected_30d: projected30d,
        projected_60d: projected60d,
        projected_90d: projected90d,
        avg_daily_inflow: avgDailyInflow,
        avg_daily_outflow: avgDailyOutflow,
        burn_rate: burnRate,
        runway_days: runwayDays,
        trend
      });

      // 6. Gerar alertas
      generateAlerts(projections, currentBalance, burnRate);

    } catch (error: any) {
      console.error('Erro ao gerar projeções:', error);
      toast.error('Erro ao gerar projeções de fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (projections: CashFlowScenario[], currentBalance: number, burnRate: number) => {
    const newAlerts: CashFlowAlert[] = [];

    // Alerta de saldo negativo projetado
    const firstNegative = projections.find(p => p.pessimistic < 0);
    if (firstNegative) {
      newAlerts.push({
        id: 'negative_balance',
        type: 'negative_balance',
        severity: 'high',
        title: 'Saldo Negativo Projetado',
        description: `Cenário pessimista indica saldo negativo em ${format(new Date(firstNegative.date), 'dd/MM/yyyy')}`,
        date: firstNegative.date,
        amount: firstNegative.pessimistic,
        dismissed: false
      });
    }

    // Alerta de saldo baixo (< 20% do atual)
    const lowBalance = projections.find(p => p.realistic < currentBalance * 0.2 && p.realistic > 0);
    if (lowBalance) {
      newAlerts.push({
        id: 'low_balance',
        type: 'low_balance',
        severity: 'medium',
        title: 'Saldo Baixo Projetado',
        description: `Projeção realista indica saldo baixo (${formatCurrency(lowBalance.realistic)}) em ${format(new Date(lowBalance.date), 'dd/MM/yyyy')}`,
        date: lowBalance.date,
        amount: lowBalance.realistic,
        dismissed: false
      });
    }

    // Alerta de burn rate alto
    if (burnRate > currentBalance * 0.05) {
      newAlerts.push({
        id: 'high_outflow',
        type: 'high_outflow',
        severity: 'medium',
        title: 'Taxa de Queima Elevada',
        description: `Despesas diárias excedem receitas em ${formatCurrency(burnRate)}`,
        date: new Date().toISOString().split('T')[0],
        amount: burnRate,
        dismissed: false
      });
    }

    // Alerta de tendência de declínio
    const last30Days = projections.slice(60, 90);
    const avgLast30 = last30Days.reduce((sum, p) => sum + p.realistic, 0) / 30;
    if (avgLast30 < currentBalance * 0.7) {
      newAlerts.push({
        id: 'trend_decline',
        type: 'trend_decline',
        severity: 'low',
        title: 'Tendência de Declínio',
        description: 'Projeções indicam declínio de 30%+ no saldo nos próximos 90 dias',
        date: projections[89]?.date || '',
        amount: avgLast30,
        dismissed: false
      });
    }

    setAlerts(newAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, dismissed: true } : a
    ));
  };

  const getActiveAlerts = () => {
    return alerts.filter(a => !a.dismissed);
  };

  return {
    loading,
    scenarios,
    alerts,
    metrics,
    generateAdvancedProjections,
    dismissAlert,
    getActiveAlerts
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function format(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
