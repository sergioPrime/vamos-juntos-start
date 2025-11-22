import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'

export interface Purchase {
  id: string
  org_id: string
  purchase_number: string
  purchase_code: number
  supplier_id?: string
  purchase_date: string
  delivery_date?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'partial_received' | 'received' | 'cancelled'
  total_amount: number
  discount_amount?: number
  freight_amount?: number
  other_expenses?: number
  notes?: string
  delivery_address?: string
  payment_condition?: string
  requested_by: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  company_id?: string
  cost_center_id?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_percentage?: number
  discount_amount?: number
  total_price: number
  received_quantity: number
  warehouse_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePurchaseInput {
  supplier_id?: string
  purchase_date?: string
  delivery_date?: string
  status?: Purchase['status']
  discount_amount?: number
  freight_amount?: number
  other_expenses?: number
  notes?: string
  delivery_address?: string
  payment_condition?: string
  company_id?: string
  cost_center_id?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount_percentage?: number
    discount_amount?: number
    warehouse_id?: string
    notes?: string
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
          supplier:pessoas!purchases_supplier_id_fkey(id, nome_razao_social),
          company:companies(id, name),
          cost_center:cost_centers(id, name)
        `)
        .eq('org_id', currentOrg.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      return data as Purchase[]
    },
    enabled: !!currentOrg?.id,
  })

  // Fetch single purchase with items
  const getPurchase = async (purchaseId: string) => {
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:pessoas!purchases_supplier_id_fkey(id, nome_razao_social),
        company:companies(id, name),
        cost_center:cost_centers(id, name)
      `)
      .eq('id', purchaseId)
      .single()

    if (purchaseError) throw purchaseError

    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select(`
        *,
        product:products(id, nome, codigo, unidade_medida)
      `)
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

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          org_id: currentOrg.id,
          supplier_id: input.supplier_id,
          purchase_date: input.purchase_date || new Date().toISOString().split('T')[0],
          delivery_date: input.delivery_date,
          status: input.status || 'draft',
          discount_amount: input.discount_amount || 0,
          freight_amount: input.freight_amount || 0,
          other_expenses: input.other_expenses || 0,
          notes: input.notes,
          delivery_address: input.delivery_address,
          payment_condition: input.payment_condition,
          company_id: input.company_id,
          cost_center_id: input.cost_center_id,
          requested_by: user.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create items
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map(item => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage || 0,
          discount_amount: item.discount_amount || 0,
          warehouse_id: item.warehouse_id,
          notes: item.notes,
        }))

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

      // Update purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .update(updateData)
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
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            discount_amount: item.discount_amount || 0,
            warehouse_id: item.warehouse_id,
            notes: item.notes,
          }))

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
    mutationFn: async ({ purchaseId, status, reason }: { 
      purchaseId: string
      status: Purchase['status']
      reason?: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = { status }

      if (status === 'approved') {
        updateData.approved_by = user.id
        updateData.approved_at = new Date().toISOString()
      } else if (status === 'rejected') {
        updateData.rejection_reason = reason
      }

      const { data, error } = await supabase
        .from('purchases')
        .update(updateData)
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
