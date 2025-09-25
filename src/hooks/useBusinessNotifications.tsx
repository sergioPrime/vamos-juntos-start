import { useCallback, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'
import { useStockValidation } from './useStockValidation'

export interface BusinessNotification {
  id: string
  type: 'stock_low' | 'payment_due' | 'order_completed' | 'system_alert'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  read: boolean
  data?: any
}

export function useBusinessNotifications() {
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()
  const { checkLowStock } = useStockValidation()

  // Check for low stock and notify
  const checkAndNotifyLowStock = useCallback(async () => {
    if (!currentOrg?.id) return

    try {
      const lowStockProducts = await checkLowStock()
      
      if (lowStockProducts.length > 0) {
        const message = lowStockProducts.length === 1 
          ? `Produto ${lowStockProducts[0].name} está com estoque baixo`
          : `${lowStockProducts.length} produtos estão com estoque baixo`

        toast({
          title: "Alerta de Estoque",
          description: message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error checking low stock notifications:', error)
    }
  }, [currentOrg?.id, checkLowStock, toast])

  // Check for payments due soon
  const checkPaymentsDue = useCallback(async () => {
    if (!currentOrg?.id) return

    try {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const { data: dueSoon, error } = await supabase
        .from('financial_entries')
        .select('id, description, due_date, amount')
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'payable')
        .eq('is_settled', false)
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true })

      if (error) throw error

      if (dueSoon && dueSoon.length > 0) {
        const overdue = dueSoon.filter(item => new Date(item.due_date) < new Date())
        const upcoming = dueSoon.filter(item => new Date(item.due_date) >= new Date())

        if (overdue.length > 0) {
          toast({
            title: "Contas em Atraso",
            description: `${overdue.length} conta(s) em atraso`,
            variant: "destructive",
          })
        }

        if (upcoming.length > 0) {
          toast({
            title: "Contas Vencendo",
            description: `${upcoming.length} conta(s) vencendo em até 3 dias`,
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error('Error checking payments due:', error)
    }
  }, [currentOrg?.id, toast])

  // Notify order completion
  const notifyOrderCompletion = useCallback((orderNumber: string, amount: number) => {
    toast({
      title: "Pedido Finalizado",
      description: `Pedido ${orderNumber} finalizado com sucesso! Valor: R$ ${amount.toFixed(2)}`,
      variant: "default",
    })
  }, [toast])

  // Notify purchase receipt
  const notifyPurchaseReceipt = useCallback((purchaseNumber: string, amount: number) => {
    toast({
      title: "Compra Recebida",
      description: `Compra ${purchaseNumber} recebida! Valor: R$ ${amount.toFixed(2)}`,
      variant: "default",
    })
  }, [toast])

  // Notify stock movement
  const notifyStockMovement = useCallback((productName: string, quantity: number, type: string) => {
    const typeLabel = type === 'in' ? 'Entrada' : type === 'out' ? 'Saída' : 'Ajuste'
    toast({
      title: "Movimento de Estoque",
      description: `${typeLabel}: ${Math.abs(quantity)} unidades de ${productName}`,
      variant: "default",
    })
  }, [toast])

  // Notify financial transaction
  const notifyFinancialTransaction = useCallback((description: string, amount: number, type: string) => {
    const typeLabel = type === 'inflow' ? 'Entrada' : 'Saída'
    toast({
      title: `${typeLabel} Financeira`,
      description: `${description}: R$ ${amount.toFixed(2)}`,
      variant: type === 'inflow' ? "default" : "destructive",
    })
  }, [toast])

  // Run periodic checks (called manually or on intervals)
  const runPeriodicChecks = useCallback(async () => {
    await Promise.all([
      checkAndNotifyLowStock(),
      checkPaymentsDue()
    ])
  }, [checkAndNotifyLowStock, checkPaymentsDue])

  // Setup real-time subscriptions for business events
  useEffect(() => {
    if (!currentOrg?.id || !user?.id) return

    // Subscribe to order updates
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `org_id=eq.${currentOrg.id}`
        },
        (payload) => {
          const order = payload.new as any
          if (order.status === 'completed' && payload.old?.status !== 'completed') {
            notifyOrderCompletion(order.order_number, order.total_amount)
          }
        }
      )
      .subscribe()

    // Subscribe to stock movements
    const stockChannel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: `org_id=eq.${currentOrg.id}`
        },
        async (payload) => {
          const movement = payload.new as any
          
          // Get product name for notification
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', movement.product_id)
            .single()

          if (product) {
            notifyStockMovement(product.name, movement.quantity, movement.movement_type)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(stockChannel)
    }
  }, [currentOrg?.id, user?.id, notifyOrderCompletion, notifyStockMovement])

  return {
    runPeriodicChecks,
    checkAndNotifyLowStock,
    checkPaymentsDue,
    notifyOrderCompletion,
    notifyPurchaseReceipt,
    notifyStockMovement,
    notifyFinancialTransaction
  }
}