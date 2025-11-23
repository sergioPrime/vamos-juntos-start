import { useState } from 'react'

export interface WebhookLog {
  id: string
  event_type: string
  event_id: string
  status: 'success' | 'failed' | 'pending'
  payload: any
  error_message?: string
  created_at: string
  processed_at?: string
}

export function useWebhookLogs() {
  // Dados de exemplo até termos a tabela webhook_logs no banco
  const mockLogs: WebhookLog[] = [
    {
      id: '1',
      event_type: 'checkout.session.completed',
      event_id: 'evt_1234567890',
      status: 'success',
      payload: { customer: 'cus_123', amount: 9900 },
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      processed_at: new Date(Date.now() - 1000 * 60 * 5 + 1000).toISOString()
    },
    {
      id: '2',
      event_type: 'customer.subscription.created',
      event_id: 'evt_0987654321',
      status: 'success',
      payload: { subscription: 'sub_123', plan: 'price_pro' },
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      processed_at: new Date(Date.now() - 1000 * 60 * 30 + 2000).toISOString()
    },
    {
      id: '3',
      event_type: 'invoice.payment_failed',
      event_id: 'evt_5555555555',
      status: 'failed',
      payload: { invoice: 'in_123', customer: 'cus_456' },
      error_message: 'Cartão recusado',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    }
  ]

  const [logs] = useState<WebhookLog[]>(mockLogs)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const refresh = async () => {
    // TODO: Implementar fetch real quando a tabela webhook_logs existir
    console.log('Refreshing webhook logs...')
  }

  const filterByEventType = (eventType: string) => {
    return logs.filter(log => log.event_type === eventType)
  }

  const filterByStatus = (status: 'success' | 'failed' | 'pending') => {
    return logs.filter(log => log.status === status)
  }

  const getStats = () => {
    return {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      pending: logs.filter(l => l.status === 'pending').length
    }
  }

  return {
    logs,
    loading,
    error,
    refresh,
    filterByEventType,
    filterByStatus,
    getStats
  }
}
