import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useInventoryIntegration } from './useInventoryIntegration'
import { useToast } from './use-toast'

interface PurchaseReceiptHookProps {
  purchase_id: string
  status: string
}

export function usePurchaseIntegration() {
  const { processPurchaseReceipt } = useInventoryIntegration()
  const { toast } = useToast()

  // Handle purchase receipt with inventory integration
  const handlePurchaseReceipt = useCallback(async (purchaseData: PurchaseReceiptHookProps) => {
    try {
      // Only process when purchase is received
      if (purchaseData.status === 'received') {
        // For now, we'll create a mock purchase items structure
        // In a real implementation, this would come from a purchases table
        const mockPurchaseItems = [
          {
            product_id: 'sample-product-id',
            quantity: 10,
            cost_price: 25.50
          }
        ]

        // Process automatic stock entry
        await processPurchaseReceipt({
          purchase_id: purchaseData.purchase_id,
          items: mockPurchaseItems
        })

        toast({
          title: "Integração automática",
          description: "Estoque atualizado automaticamente após recebimento da compra.",
        })
      }
    } catch (error) {
      console.error('Error in purchase integration:', error)
      toast({
        title: "Erro na integração",
        description: "Erro ao processar integração automática da compra.",
        variant: "destructive",
      })
    }
  }, [processPurchaseReceipt, toast])

  // Register purchase receipt with automatic integrations
  const registerPurchaseReceiptWithIntegration = useCallback(async (
    purchaseId: string,
    items: Array<{ product_id: string; quantity: number; cost_price: number }>
  ) => {
    try {
      // Process automatic stock entry
      await processPurchaseReceipt({
        purchase_id: purchaseId,
        items: items
      })

      return { success: true }
    } catch (error) {
      console.error('Error registering purchase receipt:', error)
      throw error
    }
  }, [processPurchaseReceipt])

  return {
    handlePurchaseReceipt,
    registerPurchaseReceiptWithIntegration
  }
}