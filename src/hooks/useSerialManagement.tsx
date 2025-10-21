import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

export type SerialStatus = 'in_stock' | 'sold' | 'returned' | 'defective'

export interface ProductSerial {
  id: string
  org_id: string
  product_id: string
  lot_id?: string
  serial_number: string
  status: SerialStatus
  sold_to_customer_id?: string
  sold_at?: string
  order_id?: string
  warranty_expiry?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateSerialData {
  product_id: string
  serial_number: string
  lot_id?: string
  warranty_expiry?: string
  notes?: string
}

export interface SerialWithDetails {
  serial_id: string
  serial_number: string
  status: SerialStatus
  lot_number?: string
  sold_at?: string
  customer_name?: string
}

export function useSerialManagement() {
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()

  // Create serial number
  const createSerial = useCallback(async (serialData: CreateSerialData): Promise<ProductSerial | null> => {
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
        .from('product_serials')
        .insert({
          ...serialData,
          org_id: currentOrg.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating serial:', error)
        
        if (error.message?.includes('unique_serial_number_per_product') || 
            error.message?.includes('já existe')) {
          toast({
            title: "Número de série duplicado",
            description: `O número de série "${serialData.serial_number}" já existe para este produto`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao criar número de série",
            description: error.message,
            variant: "destructive",
          })
        }
        return null
      }

      return data as ProductSerial
    } catch (error) {
      console.error('Error creating serial:', error)
      toast({
        title: "Erro ao criar número de série",
        description: "Ocorreu um erro ao criar o número de série",
        variant: "destructive",
      })
      return null
    }
  }, [currentOrg?.id, user?.id, toast])

  // Create multiple serial numbers
  const createMultipleSerials = useCallback(async (
    serialsData: CreateSerialData[]
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    if (!currentOrg?.id || !user?.id) {
      return { success: 0, failed: serialsData.length, errors: ['Organização ou usuário não encontrado'] }
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const serialData of serialsData) {
      const serial = await createSerial(serialData)
      if (serial) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`Falha ao criar ${serialData.serial_number}`)
      }
    }

    if (results.success > 0) {
      toast({
        title: "Números de série criados",
        description: `${results.success} número(s) de série criado(s) com sucesso`,
      })
    }

    if (results.failed > 0) {
      toast({
        title: "Alguns números falharam",
        description: `${results.failed} número(s) de série falharam. Verifique se já existem.`,
        variant: "destructive",
      })
    }

    return results
  }, [currentOrg?.id, user?.id, createSerial, toast])

  // Get serials by product
  const getProductSerials = useCallback(async (
    productId: string,
    status?: SerialStatus
  ): Promise<SerialWithDetails[]> => {
    if (!currentOrg?.id) return []

    try {
      const { data, error } = await supabase.rpc('get_product_serials' as any, {
        p_product_id: productId,
        p_org_id: currentOrg.id,
        p_status: status || null
      }) as any

      if (error) {
        console.error('Error getting serials:', error)
        return []
      }

      return (data || []) as SerialWithDetails[]
    } catch (error) {
      console.error('Error getting serials:', error)
      return []
    }
  }, [currentOrg?.id])

  // Update serial status
  const updateSerialStatus = useCallback(async (
    serialId: string,
    status: SerialStatus,
    additionalData?: {
      sold_to_customer_id?: string
      sold_at?: string
      order_id?: string
      notes?: string
    }
  ): Promise<boolean> => {
    if (!currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from('product_serials')
        .update({
          status,
          ...additionalData
        })
        .eq('id', serialId)
        .eq('org_id', currentOrg.id)

      if (error) {
        console.error('Error updating serial status:', error)
        toast({
          title: "Erro ao atualizar status",
          description: error.message,
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating serial status:', error)
      return false
    }
  }, [currentOrg?.id, toast])

  // Mark serial as sold
  const markSerialAsSold = useCallback(async (
    serialId: string,
    customerId: string,
    orderId: string
  ): Promise<boolean> => {
    return updateSerialStatus(serialId, 'sold', {
      sold_to_customer_id: customerId,
      sold_at: new Date().toISOString(),
      order_id: orderId
    })
  }, [updateSerialStatus])

  // Get available serials (in stock)
  const getAvailableSerials = useCallback(async (productId: string) => {
    return getProductSerials(productId, 'in_stock')
  }, [getProductSerials])

  // Validate serial number format
  const validateSerialNumber = useCallback((serialNumber: string): boolean => {
    // Basic validation: non-empty, alphanumeric with some special chars
    const regex = /^[A-Z0-9-_]+$/i
    return regex.test(serialNumber.trim())
  }, [])

  // Check if product requires serial control
  const requiresSerialControl = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('has_serial_control')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error checking serial control:', error)
        return false
      }

      return data?.has_serial_control || false
    } catch (error) {
      console.error('Error checking serial control:', error)
      return false
    }
  }, [])

  // Get serial by number
  const getSerialByNumber = useCallback(async (
    productId: string,
    serialNumber: string
  ): Promise<ProductSerial | null> => {
    if (!currentOrg?.id) return null

    try {
      const { data, error } = await supabase
        .from('product_serials')
        .select('*')
        .eq('product_id', productId)
        .eq('serial_number', serialNumber)
        .eq('org_id', currentOrg.id)
        .single()

      if (error) {
        console.error('Error getting serial:', error)
        return null
      }

      return data as ProductSerial
    } catch (error) {
      console.error('Error getting serial:', error)
      return null
    }
  }, [currentOrg?.id])

  return {
    createSerial,
    createMultipleSerials,
    getProductSerials,
    getAvailableSerials,
    updateSerialStatus,
    markSerialAsSold,
    validateSerialNumber,
    requiresSerialControl,
    getSerialByNumber
  }
}
