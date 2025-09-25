import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface StockValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function useStockValidation() {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  // Validate stock availability for order items
  const validateOrderStock = useCallback(async (
    items: Array<{ product_id: string; quantity: number; product_name?: string }>
  ): Promise<StockValidationResult> => {
    if (!currentOrg?.id) {
      return { isValid: false, errors: ['Organização não encontrada'], warnings: [] }
    }

    const result: StockValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Get product stock information
      const productIds = items.map(item => item.product_id).filter(Boolean)
      
      if (productIds.length === 0) {
        result.errors.push('Nenhum produto válido encontrado')
        result.isValid = false
        return result
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, track_stock')
        .in('id', productIds)
        .eq('org_id', currentOrg.id)

      if (error) throw error

      // Validate each item
      for (const item of items) {
        const product = products?.find(p => p.id === item.product_id)
        
        if (!product) {
          result.errors.push(`Produto não encontrado: ${item.product_name || item.product_id}`)
          result.isValid = false
          continue
        }

        // Only validate stock if product tracks stock
        if (product.track_stock) {
          if (product.stock_quantity < item.quantity) {
            result.errors.push(
              `Estoque insuficiente para ${product.name}: disponível ${product.stock_quantity}, solicitado ${item.quantity}`
            )
            result.isValid = false
          } else if (product.stock_quantity - item.quantity < (product.min_stock_level || 0)) {
            result.warnings.push(
              `${product.name} ficará abaixo do estoque mínimo após esta venda`
            )
          }
        }
      }

    } catch (error) {
      console.error('Error validating stock:', error)
      result.errors.push('Erro ao validar estoque')
      result.isValid = false
    }

    return result
  }, [currentOrg?.id])

  // Check if any products are below minimum stock level
  const checkLowStock = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data: lowStockProducts, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, reorder_point')
        .eq('org_id', currentOrg.id)
        .eq('track_stock', true)
        .filter('stock_quantity', 'lte', 'min_stock_level')

      if (error) throw error

      return lowStockProducts || []
    } catch (error) {
      console.error('Error checking low stock:', error)
      return []
    }
  }, [currentOrg?.id])

  // Show stock validation toast messages
  const showValidationMessages = useCallback((result: StockValidationResult) => {
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        toast({
          title: "Erro de Estoque",
          description: error,
          variant: "destructive",
        })
      })
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        toast({
          title: "Aviso de Estoque",
          description: warning,
          variant: "default",
        })
      })
    }
  }, [toast])

  return {
    validateOrderStock,
    checkLowStock,
    showValidationMessages
  }
}