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
      // Note: Stock validation is now handled by database triggers
      // The trigger will automatically prevent insufficient stock and sync quantities
      
      // Create stock movements for each item
      const movements = orderData.items.map(item => ({
        org_id: currentOrg.id,
        product_id: item.product_id,
        movement_type: 'out',
        quantity: item.quantity,
        reference_type: 'order',
        reference_id: orderData.order_id,
        notes: `Saída automática - Pedido #${orderData.order_id.slice(0, 8)}`,
        created_by: user.id,
      }))

      // Insert movements - triggers will handle validation and stock sync
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(movements)

      if (movementError) {
        console.error('Error creating stock movements:', movementError)
        // Check if it's a stock validation error from trigger
        if (movementError.message?.includes('Estoque insuficiente')) {
          toast({
            title: "Estoque insuficiente",
            description: movementError.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao atualizar estoque",
            description: "Houve um erro ao processar a movimentação de estoque.",
            variant: "destructive",
          })
        }
        throw movementError
      }

      // Update CMV (Cost of Goods Sold) for accounting
      await updateCMV(orderData.items)

      toast({
        title: "Estoque atualizado",
        description: "Movimentação de estoque registrada automaticamente.",
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error processing order completion:', error)
      throw error
    }
  }, [user?.id, currentOrg?.id, toast])

  // Process automatic stock entry when purchase is received
  const processPurchaseReceipt = useCallback(async (purchaseData: PurchaseReceiptData) => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('User or organization not found')
    }

    try {
      // Create stock movements for each item
      // Triggers will automatically sync stock quantities
      const movements = purchaseData.items.map(item => ({
        org_id: currentOrg.id,
        product_id: item.product_id,
        movement_type: 'in',
        quantity: item.quantity,
        unit_cost: item.cost_price,
        reference_type: 'purchase',
        reference_id: purchaseData.purchase_id,
        notes: `Entrada automática - Compra #${purchaseData.purchase_id.slice(0, 8)}`,
        created_by: user.id,
      }))

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(movements)

      if (movementError) {
        console.error('Error creating stock movements:', movementError)
        toast({
          title: "Erro ao atualizar estoque",
          description: "Houve um erro ao processar a entrada de estoque.",
          variant: "destructive",
        })
        throw movementError
      }

      // Update product costs based on purchase prices
      await updateProductCosts(purchaseData.items)

      toast({
        title: "Estoque atualizado",
        description: "Entrada de estoque registrada automaticamente.",
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error processing purchase receipt:', error)
      throw error
    }
  }, [user?.id, currentOrg?.id, toast])

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

  // Manual stock movement creation (with automatic validation)
  const createStockMovement = useCallback(async (movementData: StockMovementData) => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('User or organization not found')
    }

    try {
      // Database triggers will validate stock and sync quantities automatically
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          ...movementData,
          org_id: currentOrg.id,
          created_by: user.id,
        })

      if (error) {
        console.error('Error creating stock movement:', error)
        
        // Check if it's a stock validation error from trigger
        if (error.message?.includes('Estoque insuficiente')) {
          toast({
            title: "Estoque insuficiente",
            description: error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao criar movimentação",
            description: "Houve um erro ao registrar a movimentação.",
            variant: "destructive",
          })
        }
        throw error
      }

      toast({
        title: "Movimentação registrada",
        description: "Estoque atualizado automaticamente.",
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error creating stock movement:', error)
      throw error
    }
  }, [user?.id, currentOrg?.id, toast])

  // Check stock levels and alert for low stock
  const checkStockLevels = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      // Use the database function to check low stock
      const { data: lowStockProducts, error } = await supabase
        .rpc('check_low_stock_alert')

      if (error) throw error

      // Filter by current organization
      const orgProducts = (lowStockProducts || []).filter(
        p => p.org_id === currentOrg.id
      )

      return orgProducts.map(p => ({
        id: p.product_id,
        name: p.product_name,
        stock_quantity: p.current_stock,
        min_stock_level: p.min_stock,
        reorder_point: p.reorder_point
      }))
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