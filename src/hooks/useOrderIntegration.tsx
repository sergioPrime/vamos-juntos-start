import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useInventoryIntegration } from './useInventoryIntegration'
import { useFinancialEntries } from './useFinancialEntries'
import { useStockValidation } from './useStockValidation'
import { useToast } from './use-toast'

interface OrderCompletionHookProps {
  order_id: string
  status: string
  payment_status: string
}

export function useOrderIntegration() {
  const { processOrderCompletion } = useInventoryIntegration()
  const { createFromOrder } = useFinancialEntries()
  const { validateOrderStock, showValidationMessages } = useStockValidation()
  const { toast } = useToast()

  // Handle order status change with inventory integration
  const handleOrderStatusChange = useCallback(async (orderData: OrderCompletionHookProps) => {
    try {
      // Only process when order is completed and paid
      if (orderData.status === 'completed' && orderData.payment_status === 'paid') {
        // Get order items for stock movement
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, unit_price, product_name')
          .eq('order_id', orderData.order_id)

        if (itemsError) throw itemsError

        if (orderItems && orderItems.length > 0) {
          // Validate stock before processing
          const stockValidation = await validateOrderStock(
            orderItems.map(item => ({
              product_id: item.product_id || '',
              quantity: item.quantity,
              product_name: item.product_name || 'Produto'
            }))
          )

          showValidationMessages(stockValidation)

          if (!stockValidation.isValid) {
            throw new Error('Estoque insuficiente para completar o pedido')
          }

          // Process automatic stock exit
          await processOrderCompletion({
            order_id: orderData.order_id,
            items: orderItems.map(item => ({
              product_id: item.product_id || '',
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          })

          // Get order details for financial entry
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('customer_id, total_amount, payment_method')
            .eq('id', orderData.order_id)
            .single()

          if (orderError) throw orderError

          // Create financial entry (receivable) with real data
          await createFromOrder(
            orderData.order_id, 
            order.customer_id || '', 
            order.total_amount,
            undefined, // dueDate será calculado automaticamente
            undefined, // chartOfAccountId
            undefined, // costCenterId
            order.payment_method || undefined // Passar método de pagamento
          )

          toast({
            title: "Integração automática",
            description: "Estoque e financeiro atualizados automaticamente após conclusão do pedido.",
          })
        }
      }
    } catch (error) {
      console.error('Error in order integration:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro na integração",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }, [processOrderCompletion, validateOrderStock, showValidationMessages, toast])

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