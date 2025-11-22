import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useNavigate } from 'react-router-dom'

interface OrderData {
  id: string
  order_number: string
  customer_id: string | null
  total_amount: number
  subtotal: number
  order_date: string
}

interface OrderItem {
  product_id: string
  product_name: string
  product_sku: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export function useFiscalIntegration() {
  const { toast } = useToast()
  const navigate = useNavigate()

  // Criar NFe a partir de um pedido
  const createNFeFromOrder = useCallback(async (orderId: string) => {
    try {
      // Buscar dados do pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Buscar itens do pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      // Buscar dados do cliente
      const { data: customer, error: customerError } = await supabase
        .from('pessoas')
        .select('*')
        .eq('id', order.customer_id)
        .single()

      if (customerError) {
        console.warn('Cliente não encontrado:', customerError)
      }

      // Navegar para o formulário de NFe com dados pré-preenchidos
      navigate('/fiscal/nfe/new', {
        state: {
          fromOrder: true,
          orderData: {
            ...order,
            customer: customer
          },
          orderItems: orderItems
        }
      })

      toast({
        title: "Preparando emissão de NFe",
        description: "Você será redirecionado para o formulário de emissão.",
      })

      return { success: true }
    } catch (error) {
      console.error('Error creating NFe from order:', error)
      toast({
        title: "Erro ao preparar NFe",
        description: "Não foi possível preparar a emissão da NFe.",
        variant: "destructive",
      })
      throw error
    }
  }, [navigate, toast])

  // Verificar se pedido já tem NFe associada
  const checkOrderHasNFe = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      // TODO: Implementar quando a tabela de NFe for criada
      // Por enquanto, retorna false
      return false
    } catch (error) {
      console.error('Error checking if order has NFe:', error)
      return false
    }
  }, [])

  return {
    createNFeFromOrder,
    checkOrderHasNFe
  }
}
