import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'
import { Database } from '@/integrations/supabase/types'

type Purchase = Database['public']['Tables']['purchases']['Row']
type PurchaseInsert = Database['public']['Tables']['purchases']['Insert']
type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']
type PurchaseItemInsert = Database['public']['Tables']['purchase_items']['Insert']

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

export interface UpdatePurchaseInput extends Partial<CreatePurchaseInput> {
  id: string
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
          supplier:pessoas!purchases_supplier_id_fkey(id, nome_razao_social)
        `)
        .eq('org_id', currentOrg.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!currentOrg?.id,
  })

  // Fetch single purchase with items
  const getPurchase = async (purchaseId: string) => {
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:pessoas!purchases_supplier_id_fkey(id, nome_razao_social)
      `)
      .eq('id', purchaseId)
      .single()

    if (purchaseError) throw purchaseError

    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', purchaseId)

    if (itemsError) throw itemsError

    return { purchase, items }
  }

  // Create purchase
  const createPurchase = useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      if (!currentOrg?.id) throw new Error('Organização não encontrada')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Calculate subtotal and total
      const subtotal = input.items.reduce((sum, item) => 
        sum + (item.total_price || item.quantity * item.unit_price), 0
      )

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          org_id: currentOrg.id,
          supplier_id: input.supplier_id,
          purchase_date: input.purchase_date || new Date().toISOString().split('T')[0],
          purchase_number: '', // Will be set by trigger
          status: input.status || 'pending',
          payment_status: input.payment_status || 'pending',
          subtotal,
          total_amount: subtotal,
          notes: input.notes,
          created_by: user.id,
        } as PurchaseInsert)
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create items
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map(item => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price || item.quantity * item.unit_price,
        } as PurchaseItemInsert))

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      return purchase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra criado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error creating purchase:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar pedido de compra',
        variant: 'destructive',
      })
    },
  })

  // Update purchase
  const updatePurchase = useMutation({
    mutationFn: async (input: UpdatePurchaseInput) => {
      const { id, items, ...updateData } = input

      // Calculate new totals if items provided
      let updateFields: any = { ...updateData }
      if (items) {
        const subtotal = items.reduce((sum, item) => 
          sum + (item.total_price || item.quantity * item.unit_price), 0
        )
        updateFields.subtotal = subtotal
        updateFields.total_amount = subtotal
      }

      // Update purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', id)

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            purchase_id: id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price || item.quantity * item.unit_price,
          } as PurchaseItemInsert))

          const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(itemsToInsert)

          if (itemsError) throw itemsError
        }
      }

      return purchase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra atualizado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error updating purchase:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar pedido de compra',
        variant: 'destructive',
      })
    },
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
    getPurchase,
    createPurchase: createPurchase.mutateAsync,
    updatePurchase: updatePurchase.mutateAsync,
    deletePurchase: deletePurchase.mutateAsync,
    changeStatus: changeStatus.mutateAsync,
  }
}
