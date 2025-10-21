import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface StockValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface StockValidationItem {
  product_id: string
  quantity: number
  product_name?: string
  warehouse_id?: string
}

export function useStockValidation() {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  // Validate stock availability for order items
  const validateOrderStock = useCallback(async (
    items: StockValidationItem[]
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
        .select('id, name, stock_quantity, min_stock_level, reorder_point, track_stock, active')
        .in('id', productIds)
        .eq('org_id', currentOrg.id)

      if (error) {
        console.error('Database error:', error)
        result.errors.push('Erro ao consultar produtos no banco de dados')
        result.isValid = false
        return result
      }

      if (!products || products.length === 0) {
        result.errors.push('Nenhum produto encontrado')
        result.isValid = false
        return result
      }

      // Validate each item
      for (const item of items) {
        const product = products.find(p => p.id === item.product_id)
        
        if (!product) {
          result.errors.push(`Produto não encontrado: ${item.product_name || item.product_id}`)
          result.isValid = false
          continue
        }

        // Check if product is active
        if (!product.active) {
          result.errors.push(`Produto inativo: ${product.name}`)
          result.isValid = false
          continue
        }

        // Only validate stock if product tracks stock
        if (product.track_stock) {
          const currentStock = product.stock_quantity || 0
          const minStock = product.min_stock_level || 0
          const reorderPoint = product.reorder_point || 0
          
          // Critical: No stock available
          if (currentStock <= 0) {
            result.errors.push(
              `${product.name} está sem estoque`
            )
            result.isValid = false
            continue
          }

          // Critical: Insufficient stock
          if (currentStock < item.quantity) {
            result.errors.push(
              `Estoque insuficiente para ${product.name}: disponível ${currentStock}, solicitado ${item.quantity}`
            )
            result.isValid = false
            continue
          }

          // Warning: Below minimum after operation
          const stockAfterOperation = currentStock - item.quantity
          if (minStock > 0 && stockAfterOperation < minStock) {
            result.warnings.push(
              `${product.name} ficará abaixo do estoque mínimo (${minStock}) após esta operação. Estoque resultante: ${stockAfterOperation}`
            )
          }

          // Warning: Below reorder point after operation
          if (reorderPoint > 0 && stockAfterOperation <= reorderPoint && stockAfterOperation >= minStock) {
            result.warnings.push(
              `${product.name} atingirá o ponto de reposição (${reorderPoint}). Considere reabastecer.`
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

  // Validate stock for a single product
  const validateSingleProduct = useCallback(async (
    productId: string,
    quantity: number,
    warehouseId?: string
  ): Promise<StockValidationResult> => {
    return validateOrderStock([{ product_id: productId, quantity, warehouse_id: warehouseId }])
  }, [validateOrderStock])

  // Get warehouse stock using database function
  const getWarehouseStock = useCallback(async (
    productId: string,
    warehouseId: string
  ): Promise<number> => {
    if (!currentOrg?.id) return 0

    try {
      const { data, error } = await supabase.rpc('get_warehouse_stock', {
        p_product_id: productId,
        p_warehouse_id: warehouseId
      })

      if (error) {
        console.error('Error getting warehouse stock:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error getting warehouse stock:', error)
      return 0
    }
  }, [currentOrg?.id])

  // Check if any products are below minimum stock level using database function
  const checkLowStock = useCallback(async () => {
    if (!currentOrg?.id) return []

    try {
      const { data, error } = await supabase.rpc('check_low_stock_alert')

      if (error) {
        console.error('Error checking low stock:', error)
        return []
      }

      // Filter by current organization
      return (data || []).filter(item => item.org_id === currentOrg.id)
    } catch (error) {
      console.error('Error checking low stock:', error)
      return []
    }
  }, [currentOrg?.id])

  // Validate stock before exit (with detailed warehouse check)
  const validateStockExit = useCallback(async (
    productId: string,
    quantity: number,
    warehouseId?: string
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
      // Get product information
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, track_stock, active')
        .eq('id', productId)
        .eq('org_id', currentOrg.id)
        .single()

      if (error || !product) {
        result.errors.push('Produto não encontrado')
        result.isValid = false
        return result
      }

      if (!product.active) {
        result.errors.push('Produto está inativo')
        result.isValid = false
        return result
      }

      if (!product.track_stock) {
        // Product doesn't track stock, allow operation
        return result
      }

      // Check warehouse stock if specified
      if (warehouseId) {
        const warehouseStock = await getWarehouseStock(productId, warehouseId)
        if (warehouseStock < quantity) {
          result.errors.push(
            `Estoque insuficiente no depósito. Disponível: ${warehouseStock}, Solicitado: ${quantity}`
          )
          result.isValid = false
        }
      } else {
        // Check total stock
        const totalStock = product.stock_quantity || 0
        if (totalStock < quantity) {
          result.errors.push(
            `Estoque insuficiente. Disponível: ${totalStock}, Solicitado: ${quantity}`
          )
          result.isValid = false
        }
      }

    } catch (error) {
      console.error('Error validating stock exit:', error)
      result.errors.push('Erro ao validar saída de estoque')
      result.isValid = false
    }

    return result
  }, [currentOrg?.id, getWarehouseStock])

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
    validateSingleProduct,
    validateStockExit,
    checkLowStock,
    getWarehouseStock,
    showValidationMessages
  }
}