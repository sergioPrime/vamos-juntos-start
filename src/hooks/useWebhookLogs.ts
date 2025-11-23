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
  const mockLogs: WebhookLog[] = [
    {
      id: '1',
      event_type: 'checkout.session.completed',
      event_id: 'evt_1234567890',
      status: 'success',
      payload: { customer: 'cus_123' },
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      processed_at: new Date(Date.now() - 1000 * 60 * 5 + 1000).toISOString()
    }
  ]

  const [logs] = useState<WebhookLog[]>(mockLogs)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const refresh = async () => {
    console.log('Refreshing webhook logs...')
  }

  const getStats = () => ({
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length
  })

  return { logs, loading, error, refresh, getStats }
}
