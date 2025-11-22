import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'

export interface CreatePurchaseInput {
  supplier_id?: string
  purchase_date?: string
  status?: string
  notes?: string
  payment_status?: string
  items: Array<{
    product_id?: string
    product_name: string
    quantity: number
    unit_price: number
    total_price?: number
  }>
}

export function usePurchases() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentOrg } = useOrganization()

  // Fetch all purchases
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:pessoas!purchases_supplier_id_fkey(id, nome, razao_social)
        `)
        .eq('org_id', currentOrg.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!currentOrg?.id,
  })

  // Delete purchase
  const deletePurchase = useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra excluído com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error deleting purchase:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pedido de compra',
        variant: 'destructive',
      })
    },
  })

  // Change purchase status
  const changeStatus = useMutation({
    mutationFn: async ({ purchaseId, status }: { 
      purchaseId: string
      status: string
    }) => {
      const { data, error } = await supabase
        .from('purchases')
        .update({ status })
        .eq('id', purchaseId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error changing status:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      })
    },
  })

  return {
    purchases,
    isLoading,
    deletePurchase: deletePurchase.mutateAsync,
    changeStatus: changeStatus.mutateAsync,
  }
}
