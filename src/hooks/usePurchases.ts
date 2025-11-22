import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from './use-toast'

interface PurchaseItem {
  id?: string
  purchase_id?: string
  product_id: string
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
  purchase_number: number
  supplier_id: string
  status: string
  total_amount: number
  notes?: string
  expected_delivery_date?: string
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
        .select(`
          *,
          pessoas:supplier_id (nome, razao_social)
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Purchase[]
    },
    enabled: !!currentOrg?.id
  })

  // Fetch single purchase with items
  const fetchPurchase = async (id: string) => {
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        pessoas:supplier_id (nome, razao_social)
      `)
      .eq('id', id)
      .single()

    if (purchaseError) throw purchaseError

    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select(`
        *,
        products:product_id (codigo, descricao)
      `)
      .eq('purchase_id', id)

    if (itemsError) throw itemsError

    return { purchase, items }
  }

  // Create purchase
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: {
      supplier_id: string
      expected_delivery_date?: string
      notes?: string
      items: PurchaseItem[]
    }) => {
      if (!currentOrg?.id) throw new Error('No organization selected')

      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0)

      // Get next purchase number
      const { data: lastPurchase } = await supabase
        .from('purchases')
        .select('purchase_number')
        .eq('org_id', currentOrg.id)
        .order('purchase_number', { ascending: false })
        .limit(1)
        .single()

      const purchaseNumber = (lastPurchase?.purchase_number || 0) + 1

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          org_id: currentOrg.id,
          purchase_number: purchaseNumber,
          supplier_id: data.supplier_id,
          status: 'pending',
          total_amount: totalAmount,
          notes: data.notes,
          expected_delivery_date: data.expected_delivery_date
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create purchase items
      const itemsToInsert = data.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
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
      expected_delivery_date?: string
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
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError

        // Update total amount
        const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
        const { error: updateTotalError } = await supabase
          .from('purchases')
          .update({ total_amount: totalAmount })
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

  return {
    purchases,
    isLoading,
    error,
    fetchPurchase,
    createPurchase: createPurchaseMutation.mutate,
    updatePurchase: updatePurchaseMutation.mutate,
    deletePurchase: deletePurchaseMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    isCreating: createPurchaseMutation.isPending,
    isUpdating: updatePurchaseMutation.isPending,
    isDeleting: deletePurchaseMutation.isPending
  }
}
