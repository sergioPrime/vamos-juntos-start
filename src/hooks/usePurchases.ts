import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from './use-toast'

interface PurchaseItem {
  id?: string
  purchase_id?: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at?: string
  products?: {
    codigo: string
    descricao: string
  }
}

interface Purchase {
  id: string
  org_id: string
  purchase_number: string
  supplier_id?: string
  status: string
  subtotal: number
  total_amount: number
  payment_status: string
  purchase_date: string
  received_at?: string
  notes?: string
  created_at: string
  created_by: string
  updated_at: string
  pessoas?: {
    nome?: string
    razao_social?: string
  }
}

export function usePurchases() {
  const { currentOrg } = useOrganization()
  const queryClient = useQueryClient()

  // Fetch all purchases
  const { data: purchases, isLoading, error } = useQuery({
    queryKey: ['purchases', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Purchase[]
    },
    enabled: !!currentOrg?.id
  })

  // Create purchase
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: {
      supplier_id: string
      notes?: string
      items: PurchaseItem[]
    }) => {
      if (!currentOrg?.id) throw new Error('No organization selected')

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0)
      const totalAmount = subtotal

      // Get next purchase number
      const { count } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', currentOrg.id)

      const purchaseNumber = `PC${String((count || 0) + 1).padStart(6, '0')}`

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          org_id: currentOrg.id,
          purchase_number: purchaseNumber,
          supplier_id: data.supplier_id,
          status: 'pending',
          subtotal: subtotal,
          total_amount: totalAmount,
          notes: data.notes || '',
          created_by: user.id
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create purchase items
      const itemsToInsert = data.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      return purchase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra criado com sucesso'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar pedido: ${error.message}`,
        variant: 'destructive'
      })
    }
  })

  // Update purchase
  const updatePurchaseMutation = useMutation({
    mutationFn: async (data: {
      id: string
      supplier_id?: string
      notes?: string
      items?: PurchaseItem[]
    }) => {
      const { id, items, ...purchaseData } = data

      // Update purchase
      if (Object.keys(purchaseData).length > 0) {
        const { error: purchaseError } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', id)

        if (purchaseError) throw purchaseError
      }

      // Update items if provided
      if (items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', id)

        if (deleteError) throw deleteError

        // Insert new items
        const itemsToInsert = items.map(item => ({
          purchase_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError

        // Update totals
        const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
        const { error: updateTotalError } = await supabase
          .from('purchases')
          .update({ 
            subtotal: subtotal,
            total_amount: subtotal 
          })
          .eq('id', id)

        if (updateTotalError) throw updateTotalError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra atualizado com sucesso'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar pedido: ${error.message}`,
        variant: 'destructive'
      })
    }
  })

  // Delete purchase
  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id)

      if (itemsError) throw itemsError

      // Delete purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (purchaseError) throw purchaseError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra excluído com sucesso'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir pedido: ${error.message}`,
        variant: 'destructive'
      })
    }
  })

  // Change purchase status
  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('purchases')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar status: ${error.message}`,
        variant: 'destructive'
      })
    }
  })

  // Fetch single purchase
  const usePurchaseDetails = (id?: string) => {
    return useQuery({
      queryKey: ['purchase', id],
      queryFn: async () => {
        if (!id) throw new Error('No purchase ID provided')

        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('id', id)
          .single()

        if (purchaseError) throw purchaseError

        const { data: items, error: itemsError } = await supabase
          .from('purchase_items')
          .select('*')
          .eq('purchase_id', id)

        if (itemsError) throw itemsError

        return { purchase, items }
      },
      enabled: !!id
    })
  }

  return {
    purchases,
    isLoading,
    error,
    usePurchaseDetails,
    createPurchase: createPurchaseMutation.mutate,
    updatePurchase: updatePurchaseMutation.mutate,
    deletePurchase: deletePurchaseMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    isCreating: createPurchaseMutation.isPending,
    isUpdating: updatePurchaseMutation.isPending,
    isDeleting: deletePurchaseMutation.isPending
  }
}
