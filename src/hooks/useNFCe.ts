import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'

interface EmitNFCeParams {
  orderId: string
  customer: {
    nome: string
    cpfCnpj: string | null
  }
  items: Array<{
    productId: string
    productName: string
    ncm: string
    cfop: string
    unit: string
    quantity: number
    unitValue: number
    totalValue: number
  }>
  payment: {
    paymentMethod: string
    value: number
  }
}

interface CancelNFCeParams {
  nfceId: string
  justification: string
}

export function useNFCe() {
  const { toast } = useToast()
  const { currentOrg } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)

  const emitNFCe = async (params: EmitNFCeParams) => {
    if (!currentOrg) {
      throw new Error('Organização não encontrada')
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('emit-nfce', {
        body: {
          orgId: currentOrg.id,
          ...params,
        },
      })

      if (error) throw error

      return {
        success: true,
        data: data.nfce,
      }
    } catch (error: any) {
      console.error('Error emitting NFCe:', error)
      return {
        success: false,
        error: error.message || 'Erro ao emitir NFC-e',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const cancelNFCe = async ({ nfceId, justification }: CancelNFCeParams) => {
    if (!currentOrg) {
      throw new Error('Organização não encontrada')
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-nfce', {
        body: {
          orgId: currentOrg.id,
          nfceId,
          justification,
        },
      })

      if (error) throw error

      toast({
        title: 'NFC-e cancelada',
        description: 'A NFC-e foi cancelada com sucesso.',
      })

      return {
        success: true,
        data,
      }
    } catch (error: any) {
      console.error('Error canceling NFCe:', error)
      toast({
        title: 'Erro ao cancelar NFC-e',
        description: error.message,
        variant: 'destructive',
      })
      return {
        success: false,
        error: error.message || 'Erro ao cancelar NFC-e',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const queryNFCeStatus = async (nfceId: string) => {
    if (!currentOrg) {
      throw new Error('Organização não encontrada')
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('query-nfce-status', {
        body: {
          orgId: currentOrg.id,
          nfceId,
        },
      })

      if (error) throw error

      return {
        success: true,
        data,
      }
    } catch (error: any) {
      console.error('Error querying NFCe status:', error)
      return {
        success: false,
        error: error.message || 'Erro ao consultar status da NFC-e',
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    emitNFCe,
    cancelNFCe,
    queryNFCeStatus,
    isLoading,
  }
}
