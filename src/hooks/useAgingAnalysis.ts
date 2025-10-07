import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { differenceInDays } from 'date-fns'

export interface AgingBucket {
  range: string
  count: number
  amount: number
  percentage: number
}

export interface AgingAnalysisData {
  total_receivables: number
  total_count: number
  current: AgingBucket
  days_1_30: AgingBucket
  days_31_60: AgingBucket
  days_61_90: AgingBucket
  days_91_180: AgingBucket
  over_180: AgingBucket
  by_customer: Array<{
    customer_id: string
    customer_name: string
    total_amount: number
    overdue_amount: number
    buckets: AgingBucket[]
  }>
}

export function useAgingAnalysis() {
  const { currentOrg } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [agingData, setAgingData] = useState<AgingAnalysisData | null>(null)

  useEffect(() => {
    if (currentOrg?.id) {
      loadAgingAnalysis()
    }
  }, [currentOrg?.id])

  const loadAgingAnalysis = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)

      // Buscar todos os recebíveis não liquidados
      const { data: receivables } = await supabase
        .from('financial_entries')
        .select('id, amount, due_date, person_id')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .eq('is_settled', false)

      // Buscar informações dos clientes separadamente
      const personIds = [...new Set(receivables?.map(r => r.person_id).filter(Boolean))]
      const { data: pessoas } = await supabase
        .from('pessoas')
        .select('id, nome_fantasia')
        .in('id', personIds)

      const pessoasMap = new Map(pessoas?.map(p => [p.id, p.nome_fantasia]) || [])

      if (!receivables?.length) {
        setAgingData({
          total_receivables: 0,
          total_count: 0,
          current: { range: 'A vencer', count: 0, amount: 0, percentage: 0 },
          days_1_30: { range: '1-30 dias', count: 0, amount: 0, percentage: 0 },
          days_31_60: { range: '31-60 dias', count: 0, amount: 0, percentage: 0 },
          days_61_90: { range: '61-90 dias', count: 0, amount: 0, percentage: 0 },
          days_91_180: { range: '91-180 dias', count: 0, amount: 0, percentage: 0 },
          over_180: { range: '+180 dias', count: 0, amount: 0, percentage: 0 },
          by_customer: []
        })
        return
      }

      const today = new Date()
      const totalAmount = receivables.reduce((sum, r) => sum + Number(r.amount), 0)

      // Classificar por faixas de vencimento
      const buckets = {
        current: { count: 0, amount: 0 },
        days_1_30: { count: 0, amount: 0 },
        days_31_60: { count: 0, amount: 0 },
        days_61_90: { count: 0, amount: 0 },
        days_91_180: { count: 0, amount: 0 },
        over_180: { count: 0, amount: 0 }
      }

      const customerMap = new Map()

      receivables.forEach(receivable => {
        const dueDate = new Date(receivable.due_date)
        const daysOverdue = differenceInDays(today, dueDate)
        const amount = Number(receivable.amount)

        let bucket: keyof typeof buckets
        if (daysOverdue < 0) {
          bucket = 'current'
        } else if (daysOverdue <= 30) {
          bucket = 'days_1_30'
        } else if (daysOverdue <= 60) {
          bucket = 'days_31_60'
        } else if (daysOverdue <= 90) {
          bucket = 'days_61_90'
        } else if (daysOverdue <= 180) {
          bucket = 'days_91_180'
        } else {
          bucket = 'over_180'
        }

        buckets[bucket].count++
        buckets[bucket].amount += amount

        // Agrupar por cliente
        if (receivable.person_id) {
          if (!customerMap.has(receivable.person_id)) {
            customerMap.set(receivable.person_id, {
              customer_id: receivable.person_id,
              customer_name: pessoasMap.get(receivable.person_id) || 'Cliente sem nome',
              total_amount: 0,
              overdue_amount: 0,
              buckets: {
                current: 0,
                days_1_30: 0,
                days_31_60: 0,
                days_61_90: 0,
                days_91_180: 0,
                over_180: 0
              }
            })
          }
          const customer = customerMap.get(receivable.person_id)
          customer.total_amount += amount
          customer.buckets[bucket] += amount
          if (daysOverdue > 0) {
            customer.overdue_amount += amount
          }
        }
      })

      // Converter buckets para formato final
      const agingBuckets = {
        current: {
          range: 'A vencer',
          count: buckets.current.count,
          amount: buckets.current.amount,
          percentage: (buckets.current.amount / totalAmount) * 100
        },
        days_1_30: {
          range: '1-30 dias',
          count: buckets.days_1_30.count,
          amount: buckets.days_1_30.amount,
          percentage: (buckets.days_1_30.amount / totalAmount) * 100
        },
        days_31_60: {
          range: '31-60 dias',
          count: buckets.days_31_60.count,
          amount: buckets.days_31_60.amount,
          percentage: (buckets.days_31_60.amount / totalAmount) * 100
        },
        days_61_90: {
          range: '61-90 dias',
          count: buckets.days_61_90.count,
          amount: buckets.days_61_90.amount,
          percentage: (buckets.days_61_90.amount / totalAmount) * 100
        },
        days_91_180: {
          range: '91-180 dias',
          count: buckets.days_91_180.count,
          amount: buckets.days_91_180.amount,
          percentage: (buckets.days_91_180.amount / totalAmount) * 100
        },
        over_180: {
          range: '+180 dias',
          count: buckets.over_180.count,
          amount: buckets.over_180.amount,
          percentage: (buckets.over_180.amount / totalAmount) * 100
        }
      }

      // Formatar dados por cliente
      const byCustomer = Array.from(customerMap.values())
        .map(customer => ({
          ...customer,
          buckets: [
            { range: 'A vencer', amount: customer.buckets.current, count: 0, percentage: 0 },
            { range: '1-30', amount: customer.buckets.days_1_30, count: 0, percentage: 0 },
            { range: '31-60', amount: customer.buckets.days_31_60, count: 0, percentage: 0 },
            { range: '61-90', amount: customer.buckets.days_61_90, count: 0, percentage: 0 },
            { range: '91-180', amount: customer.buckets.days_91_180, count: 0, percentage: 0 },
            { range: '+180', amount: customer.buckets.over_180, count: 0, percentage: 0 }
          ]
        }))
        .sort((a, b) => b.overdue_amount - a.overdue_amount)

      setAgingData({
        total_receivables: totalAmount,
        total_count: receivables.length,
        ...agingBuckets,
        by_customer: byCustomer
      })

    } catch (error) {
      console.error('Erro ao carregar análise de aging:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    agingData,
    refreshAnalysis: loadAgingAnalysis
  }
}
