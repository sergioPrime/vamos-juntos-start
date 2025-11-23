import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PurchaseItem {
  id?: string
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface Purchase {
  id: string
  org_id: string
  purchase_number: string
  supplier_id?: string
  purchase_date: string
  expected_delivery_date?: string
  status: string
  subtotal: number
  total_amount: number
  payment_status: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export function usePurchases(orgId: string) {
  const queryClient = useQueryClient()

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })

  const createPurchase = useMutation({
    mutationFn: async (newPurchase: Omit<Purchase, 'id' | 'org_id' | 'purchase_number' | 'created_at' | 'updated_at' | 'created_by'> & { items: PurchaseItem[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { count } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const purchaseNumber = 'PC' + String((count || 0) + 1).padStart(6, '0')

      const { items, ...purchaseData } = newPurchase

      const { data, error } = await supabase
        .from('purchases')
        .insert({
          ...purchaseData,
          org_id: orgId,
          purchase_number: purchaseNumber,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(
            items.map(item => ({
              purchase_id: data.id,
              product_id: item.product_id,
              product_name: item.product_name || '',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              org_id: orgId,
            }))
          )

        if (itemsError) throw itemsError
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', orgId] })
    },
  })

  const updatePurchase = useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<Purchase> & { id: string; items?: PurchaseItem[] }) => {
      const { data, error } = await supabase
        .from('purchases')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (items) {
        await supabase.from('purchase_items').delete().eq('purchase_id', id)

        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(
              items.map(item => ({
                purchase_id: id,
                product_id: item.product_id,
                product_name: item.product_name || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                org_id: orgId,
              }))
            )

          if (itemsError) throw itemsError
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', orgId] })
    },
  })

  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', orgId] })
    },
  })

  return {
    purchases,
    isLoading,
    createPurchase,
    updatePurchase,
    deletePurchase,
  }
}
