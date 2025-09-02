import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useInventoryIntegration } from './useInventoryIntegration'
import { useToast } from './use-toast'

interface OrderCompletionHookProps {
  order_id: string
  status: string
  payment_status: string
}

export function useOrderIntegration() {
  const { processOrderCompletion } = useInventoryIntegration()
  const { toast } = useToast()

  // Handle order status change with inventory integration
  const handleOrderStatusChange = useCallback(async (orderData: OrderCompletionHookProps) => {
    try {
      // Only process when order is completed and paid
      if (orderData.status === 'completed' && orderData.payment_status === 'paid') {
        // Get order items for stock movement
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, unit_price')
          .eq('order_id', orderData.order_id)

        if (itemsError) throw itemsError

        if (orderItems && orderItems.length > 0) {
          // Process automatic stock exit
          await processOrderCompletion({
            order_id: orderData.order_id,
            items: orderItems.map(item => ({
              product_id: item.product_id || '',
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          })

          toast({
            title: "Integração automática",
            description: "Estoque atualizado automaticamente após conclusão do pedido.",
          })
        }
      }
    } catch (error) {
      console.error('Error in order integration:', error)
      toast({
        title: "Erro na integração",
        description: "Erro ao processar integração automática do pedido.",
        variant: "destructive",
      })
    }
  }, [processOrderCompletion, toast])

  // Complete order with automatic integrations
  const completeOrderWithIntegration = useCallback(async (orderId: string) => {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'paid',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Trigger automatic integrations
      await handleOrderStatusChange({
        order_id: orderId,
        status: 'completed',
        payment_status: 'paid'
      })

      return { success: true }
    } catch (error) {
      console.error('Error completing order with integration:', error)
      throw error
    }
  }, [handleOrderStatusChange])

  return {
    handleOrderStatusChange,
    completeOrderWithIntegration
  }
}