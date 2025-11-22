import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { orderFormSchema, type OrderFormData } from '@/schemas/orders'
import { useStockValidation } from './useStockValidation'

export function useOrderForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { validateOrderStock, showValidationMessages } = useStockValidation()
  const [isSaving, setIsSaving] = useState(false)

  const generateOrderNumber = async (): Promise<string> => {
    if (!currentOrg?.id) throw new Error('Organização não encontrada')

    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .eq('org_id', currentOrg.id)
      .order('order_number', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last order number:', error)
      throw error
    }

    const lastNumber = data?.order_number ? parseInt(data.order_number.replace(/\D/g, '')) : 0
    const newNumber = lastNumber + 1
    return `PED-${String(newNumber).padStart(6, '0')}`
  }

  const saveOrder = async (formData: OrderFormData): Promise<string> => {
    if (!user?.id || !currentOrg?.id) {
      throw new Error('Usuário ou organização não encontrados')
    }

    setIsSaving(true)

    try {
      // Validate form data
      const validatedData = orderFormSchema.parse(formData)

      // Validate stock if items exist
      if (validatedData.items.length > 0) {
        const stockValidation = await validateOrderStock(
          validatedData.items
            .filter(item => item.item_type === 'product' && item.product_id)
            .map(item => ({
              product_id: item.product_id!,
              quantity: item.quantity,
              product_name: item.product_name
            }))
        )

        showValidationMessages(stockValidation)

        if (!stockValidation.isValid) {
          throw new Error('Estoque insuficiente para alguns produtos')
        }
      }

      // Generate order number if not provided
      const orderNumber = validatedData.order_number || await generateOrderNumber()

      // Calculate totals
      const subtotal = validatedData.items.reduce((sum, item) => sum + item.total_price, 0)
      const totalAmount = subtotal

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          org_id: currentOrg.id,
          owner_id: user.id,
          order_number: orderNumber,
          order_type: validatedData.order_type,
          customer_id: validatedData.customer_id,
          company_id: validatedData.company_id,
          sales_origin_id: validatedData.sales_origin_id,
          sales_category_id: validatedData.sales_category_id,
          price_table_id: validatedData.price_table_id,
          warehouse_id: validatedData.warehouse_id,
          seller_id: validatedData.seller_id,
          status: validatedData.system_status || 'draft',
          payment_status: 'pending',
          subtotal,
          total_amount: totalAmount,
          notes: validatedData.notes,
          order_date: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      if (validatedData.items.length > 0) {
        const itemsToInsert = validatedData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          service_id: item.service_id,
          product_name: item.product_name,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          auto_purchase: item.auto_purchase || false
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      toast({
        title: "Pedido salvo",
        description: `Pedido ${orderNumber} criado com sucesso!`,
      })

      return order.id

    } catch (error) {
      console.error('Error saving order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar pedido'
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return {
    saveOrder,
    generateOrderNumber,
    isSaving
  }
}
