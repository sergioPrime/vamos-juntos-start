import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useAuth } from './useAuth'
import { toast } from '@/hooks/use-toast'

interface StockTransferParams {
  productId: string
  warehouseFrom: string
  warehouseTo: string
  quantity: number
  lotId?: string
  reason?: string
  notes?: string
}

interface StockExitParams {
  productId: string
  warehouseId?: string
  quantity: number
  lotId?: string
  exitType?: string
  reason?: string
  destination?: string
  referenceDocument?: string
  notes?: string
}

interface StockEntryParams {
  productId: string
  warehouseId: string
  quantity: number
  lotId?: string
  entryType?: string
  reason?: string
  unitCost?: number
  totalCost?: number
  supplierId?: string
  referenceDocument?: string
  notes?: string
}

export function useStockOperations() {
  const { currentOrg } = useOrganization()
  const { user } = useAuth()

  const transferStock = async (params: StockTransferParams) => {
    if (!currentOrg?.id || !user?.id) {
      throw new Error('Organização ou usuário não identificado')
    }

    try {
      const { data, error } = await supabase.rpc('stock_transfer_atomic', {
        p_org_id: currentOrg.id,
        p_product_id: params.productId,
        p_warehouse_from: params.warehouseFrom,
        p_warehouse_to: params.warehouseTo,
        p_quantity: params.quantity,
        p_lot_id: params.lotId || null,
        p_reason: params.reason || null,
        p_notes: params.notes || null,
        p_created_by: user.id
      })

      if (error) throw error

      toast({
        title: 'Transferência realizada',
        description: `${params.quantity} unidades transferidas com sucesso`,
      })

      return data
    } catch (error: any) {
      toast({
        title: 'Erro na transferência',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const exitStock = async (params: StockExitParams) => {
    if (!currentOrg?.id || !user?.id) {
      throw new Error('Organização ou usuário não identificado')
    }

    try {
      const { data, error } = await supabase.rpc('stock_exit_with_validation', {
        p_org_id: currentOrg.id,
        p_product_id: params.productId,
        p_warehouse_id: params.warehouseId || null,
        p_quantity: params.quantity,
        p_lot_id: params.lotId || null,
        p_exit_type: params.exitType || 'sale',
        p_reason: params.reason || null,
        p_destination: params.destination || null,
        p_reference_document: params.referenceDocument || null,
        p_notes: params.notes || null,
        p_created_by: user.id
      })

      if (error) throw error

      toast({
        title: 'Saída registrada',
        description: `${params.quantity} unidades saíram do estoque`,
      })

      return data
    } catch (error: any) {
      toast({
        title: 'Erro na saída',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const entryStock = async (params: StockEntryParams) => {
    if (!currentOrg?.id || !user?.id) {
      throw new Error('Organização ou usuário não identificado')
    }

    try {
      const { data, error } = await supabase.rpc('stock_entry_atomic', {
        p_org_id: currentOrg.id,
        p_product_id: params.productId,
        p_warehouse_id: params.warehouseId,
        p_quantity: params.quantity,
        p_lot_id: params.lotId || null,
        p_entry_type: params.entryType || 'purchase',
        p_reason: params.reason || null,
        p_unit_cost: params.unitCost || null,
        p_total_cost: params.totalCost || null,
        p_supplier_id: params.supplierId || null,
        p_reference_document: params.referenceDocument || null,
        p_notes: params.notes || null,
        p_created_by: user.id
      })

      if (error) throw error

      toast({
        title: 'Entrada registrada',
        description: `${params.quantity} unidades adicionadas ao estoque`,
      })

      return data
    } catch (error: any) {
      toast({
        title: 'Erro na entrada',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  return {
    transferStock,
    exitStock,
    entryStock
  }
}
