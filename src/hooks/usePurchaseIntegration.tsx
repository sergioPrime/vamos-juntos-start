import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useInventoryIntegration } from './useInventoryIntegration'
import { useFinancialEntries } from './useFinancialEntries'
import { useToast } from './use-toast'

interface PurchaseReceiptHookProps {
  purchase_id: string
  status: string
}

export function usePurchaseIntegration() {
  const { processPurchaseReceipt } = useInventoryIntegration()
  const { createFromPurchase } = useFinancialEntries()
  const { toast } = useToast()

  // Handle purchase receipt with inventory integration
  const handlePurchaseReceipt = useCallback(async (purchaseData: PurchaseReceiptHookProps) => {
    try {
      // Only process when purchase is received
      if (purchaseData.status === 'received') {
        // Get purchase items for stock movement
        const { data: purchaseItems, error: itemsError } = await supabase
          .from('purchase_items')
          .select('product_id, quantity, unit_price')
          .eq('purchase_id', purchaseData.purchase_id)

        if (itemsError) throw itemsError

        // Get purchase details for financial entry
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .select('supplier_id, total_amount')
          .eq('id', purchaseData.purchase_id)
          .single()

        if (purchaseError) throw purchaseError

        if (purchaseItems && purchaseItems.length > 0) {
          // Process automatic stock entry with real data
          await processPurchaseReceipt({
            purchase_id: purchaseData.purchase_id,
            items: purchaseItems.map(item => ({
              product_id: item.product_id || '',
              quantity: item.quantity,
              cost_price: item.unit_price
            }))
          })

          // Create financial entry (payable) with real data
          await createFromPurchase(
            purchaseData.purchase_id, 
            purchase.supplier_id || '', 
            purchase.total_amount
          )
        }

        toast({
          title: "Integração automática",
          description: "Estoque e financeiro atualizados automaticamente após recebimento da compra.",
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