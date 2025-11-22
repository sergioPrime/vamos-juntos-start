import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

export interface ProductLot {
  id: string
  org_id: string
  product_id: string
  lot_number: string
  quantity: number
  manufactured_date?: string
  expiration_date?: string
  supplier_id?: string
  purchase_id?: string
  cost_price?: number
  notes?: string
  status?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateLotData {
  product_id: string
  lot_number: string
  quantity: number
  manufactured_date?: string
  expiration_date?: string
  supplier_id?: string
  purchase_id?: string
  cost_price?: number
  notes?: string
}

export interface ExpiringLot {
  lot_id: string
  product_id: string
  product_name: string
  lot_number: string
  quantity: number
  expiration_date: string
  days_until_expiry: number
}

export function useLotManagement() {
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()

  // Create or update lot
  const createLot = useCallback(async (lotData: CreateLotData): Promise<ProductLot | null> => {
    if (!currentOrg?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Organização ou usuário não encontrado",
        variant: "destructive",
      })
      return null
    }

    try {
      const { data, error } = await supabase
        .from('product_lots')
        .insert({
          ...lotData,
          org_id: currentOrg.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lot:', error)
        
        if (error.message?.includes('unique_lot_number_per_product')) {
          toast({
            title: "Lote duplicado",
            description: "Já existe um lote com este número para este produto",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao criar lote",
            description: error.message,
            variant: "destructive",
          })
        }
        return null
      }

      toast({
        title: "Lote criado",
        description: `Lote ${lotData.lot_number} criado com sucesso`,
      })

      return data as any
    } catch (error) {
      console.error('Error creating lot:', error)
      toast({
        title: "Erro ao criar lote",
        description: "Ocorreu um erro ao criar o lote",
        variant: "destructive",
      })
      return null
    }
  }, [currentOrg?.id, user?.id, toast])

  // Get available lots for product (FIFO order)
  const getAvailableLots = useCallback(async (productId: string) => {
    if (!currentOrg?.id) return []

    try {
      const { data, error } = await supabase.rpc('get_available_lots_fifo' as any, {
        p_product_id: productId,
        p_org_id: currentOrg.id
      }) as any

      if (error) {
        console.error('Error getting available lots:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting available lots:', error)
      return []
    }
  }, [currentOrg?.id])

  // Get expiring lots
  const getExpiringLots = useCallback(async (daysAhead: number = 30): Promise<ExpiringLot[]> => {
    if (!currentOrg?.id) return []

    try {
      const { data, error } = await supabase.rpc('get_expiring_lots' as any, {
        p_org_id: currentOrg.id,
        p_days_ahead: daysAhead
      }) as any

      if (error) {
        console.error('Error getting expiring lots:', error)
        return []
      }

      return (data || []) as ExpiringLot[]
    } catch (error) {
      console.error('Error getting expiring lots:', error)
      return []
    }
  }, [currentOrg?.id])

  // Get lot by ID
  const getLotById = useCallback(async (lotId: string): Promise<ProductLot | null> => {
    if (!currentOrg?.id) return null

    try {
      const { data, error } = await supabase
        .from('product_lots')
        .select('*')
        .eq('id', lotId)
        .eq('org_id', currentOrg.id)
        .single()

      if (error) {
        console.error('Error getting lot:', error)
        return null
      }

      return data as any
    } catch (error) {
      console.error('Error getting lot:', error)
      return null
    }
  }, [currentOrg?.id])

  // Get all lots for a product
  const getProductLots = useCallback(async (productId: string): Promise<ProductLot[]> => {
    if (!currentOrg?.id) return []

    try {
      const { data, error } = await supabase
        .from('product_lots')
        .select('*')
        .eq('product_id', productId)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting product lots:', error)
        return []
      }

      return (data || []) as any
    } catch (error) {
      console.error('Error getting product lots:', error)
      return []
    }
  }, [currentOrg?.id])

  // Update lot
  const updateLot = useCallback(async (
    lotId: string,
    updates: Partial<Omit<CreateLotData, 'product_id' | 'lot_number'>>
  ): Promise<boolean> => {
    if (!currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from('product_lots')
        .update(updates)
        .eq('id', lotId)
        .eq('org_id', currentOrg.id)

      if (error) {
        console.error('Error updating lot:', error)
        toast({
          title: "Erro ao atualizar lote",
          description: error.message,
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Lote atualizado",
        description: "Lote atualizado com sucesso",
      })

      return true
    } catch (error) {
      console.error('Error updating lot:', error)
      toast({
        title: "Erro ao atualizar lote",
        description: "Ocorreu um erro ao atualizar o lote",
        variant: "destructive",
      })
      return false
    }
  }, [currentOrg?.id, toast])

  // Deactivate lot
  const deactivateLot = useCallback(async (lotId: string): Promise<boolean> => {
    if (!currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from('product_lots')
        .update({ quantity: 0 } as any)
        .eq('id', lotId)
        .eq('org_id', currentOrg.id)

      if (error) {
        console.error('Error deactivating lot:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deactivating lot:', error)
      return false
    }
  }, [currentOrg?.id])

  // Check if product requires lot control
  const requiresLotControl = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('has_lot_control')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error checking lot control:', error)
        return false
      }

      return data?.has_lot_control || false
    } catch (error) {
      console.error('Error checking lot control:', error)
      return false
    }
  }, [])

  return {
    createLot,
    getAvailableLots,
    getExpiringLots,
    getLotById,
    getProductLots,
    updateLot,
    deactivateLot,
    requiresLotControl,
    suggestLotFIFO,
    validateLotFIFO,
    getExpiringLotsAlert,
    autoAllocateLots
  }
}
