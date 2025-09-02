import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

interface StockMovementData {
  product_id: string
  quantity: number
  movement_type: 'in' | 'out' | 'adjustment'
  reference_type?: string
  reference_id?: string
  notes?: string
  warehouse_id?: string
  lot_id?: string
  serial_id?: string
  expiration_date?: string
}

interface OrderCompletionData {
  order_id: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
}

interface PurchaseReceiptData {
  purchase_id: string
  items: Array<{
    product_id: string
    quantity: number
    cost_price: number
  }>
}

export function useInventoryIntegration() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  // Process automatic stock exit when order is completed/invoiced
  const processOrderCompletion = useCallback(async (orderData: OrderCompletionData) => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('User or organization not found')
    }

    try {
      // Create stock movements for each item
      const stockMovements = orderData.items.map(item => ({
        product_id: item.product_id,
        quantity: -Math.abs(item.quantity), // Negative for exit
        movement_type: 'out' as const,
        reference_type: 'order',
        reference_id: orderData.order_id,
        notes: `Saída automática - Pedido finalizado`,
        org_id: currentOrg.id,
        created_by: user.id
      }))

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(stockMovements)

      if (movementError) throw movementError

      // Update CMV (Cost of Goods Sold) for financial integration
      await updateCMV(orderData.items)

      return { success: true }
    } catch (error) {
      console.error('Error processing order completion:', error)
      throw error
    }
  }, [user?.id, currentOrg?.id])

  // Process automatic stock entry when purchase is received
  const processPurchaseReceipt = useCallback(async (purchaseData: PurchaseReceiptData) => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('User or organization not found')
    }

    try {
      // Create stock movements for each item
      const stockMovements = purchaseData.items.map(item => ({
        product_id: item.product_id,
        quantity: Math.abs(item.quantity), // Positive for entry
        movement_type: 'in' as const,
        reference_type: 'purchase',
        reference_id: purchaseData.purchase_id,
        notes: `Entrada automática - Nota de entrada`,
        org_id: currentOrg.id,
        created_by: user.id
      }))

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(stockMovements)

      if (movementError) throw movementError

      // Update product cost prices
      await updateProductCosts(purchaseData.items)

      return { success: true }
    } catch (error) {
      console.error('Error processing purchase receipt:', error)
      throw error
    }
  }, [user?.id, currentOrg?.id])

  // Update Cost of Goods Sold for financial integration
  const updateCMV = useCallback(async (items: Array<{ product_id: string; quantity: number; unit_price: number }>) => {
    if (!currentOrg?.id) return

    try {
      // Get product costs
      const productIds = items.map(item => item.product_id)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, cost_price, cost_with_additions')
        .in('id', productIds)

      if (productsError) throw productsError

      // Calculate total CMV
      let totalCMV = 0
      items.forEach(item => {
        const product = products?.find(p => p.id === item.product_id)
        if (product) {
          const costPrice = product.cost_with_additions || product.cost_price || 0
          totalCMV += costPrice * item.quantity
        }
      })

      // Create financial transaction for CMV
      if (totalCMV > 0) {
        const { error: transactionError } = await supabase
          .from('financial_transactions')
          .insert({
            org_id: currentOrg.id,
            amount: totalCMV,
            transaction_type: 'outflow',
            category: 'CMV',
            description: 'Custo de Mercadoria Vendida',
            transaction_date: new Date().toISOString().split('T')[0],
            created_by: user?.id
          })

        if (transactionError) throw transactionError
      }
    } catch (error) {
      console.error('Error updating CMV:', error)
    }
  }, [currentOrg?.id, user?.id])

  // Update product costs from purchase
  const updateProductCosts = useCallback(async (items: Array<{ product_id: string; cost_price: number }>) => {
    try {
      // Update each product's last purchase value and cost price
      for (const item of items) {
        const { error } = await supabase
          .from('products')
          .update({
            last_purchase_value: item.cost_price,
            cost_price: item.cost_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating product costs:', error)
    }
  }, [])

  // Manual stock movement with integration hooks
  const createStockMovement = useCallback(async (movementData: StockMovementData) => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('User or organization not found')
    }

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          ...movementData,
          org_id: currentOrg.id,
          created_by: user.id
        })

      if (error) throw error

      toast({
        title: "Movimentação registrada",
        description: "Movimento de estoque registrado com sucesso.",
      })

      return { success: true }
    } catch (error) {
      console.error('Error creating stock movement:', error)
      toast({
        title: "Erro ao registrar movimento",
        description: "Não foi possível registrar o movimento de estoque.",
        variant: "destructive",
      })
      throw error
    }
  }, [user?.id, currentOrg?.id, toast])

  // Check stock levels and alert for low stock
  const checkStockLevels = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: lowStockProducts, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, reorder_point')
        .eq('org_id', currentOrg.id)
        .filter('stock_quantity', 'lte', 'min_stock_level')

      if (error) throw error

      return lowStockProducts || []
    } catch (error) {
      console.error('Error checking stock levels:', error)
      return []
    }
  }, [currentOrg?.id])

  return {
    processOrderCompletion,
    processPurchaseReceipt,
    createStockMovement,
    checkStockLevels,
    updateCMV,
    updateProductCosts
  }
}