import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface StockValidationItem {
  product_id: string
  product_name: string
  quantity: number
}

interface StockValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function useStockValidation() {
  const validateStock = useCallback(async (
    items: StockValidationItem[]
  ): Promise<StockValidationResult> => {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      for (const item of items) {
        if (!item.product_id) continue
        
        // Buscar produto e estoque atual
        const { data: productData, error } = await supabase
          .from('products')
          .select('estoque_atual, estoque_minimo, nome')
          .eq('id', item.product_id)
          .single()

        if (error) {
          errors.push(`Erro ao verificar estoque de ${item.product_name}`)
          continue
        }

        // Validar quantidade disponível
        const currentStock = productData.estoque_atual || 0
        if (currentStock < item.quantity) {
          errors.push(
            `Estoque insuficiente para ${item.product_name}. ` +
            `Disponível: ${currentStock}, ` +
            `Solicitado: ${item.quantity}`
          )
        }

        // Verificar estoque mínimo após a venda
        const stockAfterSale = currentStock - item.quantity
        const minimumStock = productData.estoque_minimo || 0
        
        if (stockAfterSale < minimumStock && stockAfterSale >= 0) {
          warnings.push(
            `${item.product_name} ficará abaixo do estoque mínimo após esta venda. ` +
            `Mínimo: ${minimumStock}, ` +
            `Após venda: ${stockAfterSale}`
          )
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      console.error('Error validating stock:', error)
      return {
        isValid: false,
        errors: ['Erro ao validar estoque. Tente novamente.'],
        warnings: []
      }
    }
  }, [])

  const validateStockWithToast = useCallback(async (
    items: StockValidationItem[]
  ): Promise<boolean> => {
    const result = await validateStock(items)

    // Mostrar erros
    if (result.errors.length > 0) {
      toast.error('Estoque insuficiente', {
        description: result.errors.join('\n')
      })
      return false
    }

    // Mostrar avisos
    if (result.warnings.length > 0) {
      toast.warning('Atenção ao estoque', {
        description: result.warnings.join('\n')
      })
    }

    return true
  }, [validateStock])

  return {
    validateStock,
    validateStockWithToast
  }
}
