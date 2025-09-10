import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useToast } from '@/hooks/use-toast'

export interface PaymentMethod {
  id: string
  name: string
  code: string
  type: string
  active: boolean
  is_default: boolean
  org_id: string
  created_at: string
}

export interface CreatePaymentMethodData {
  name: string
  type: string
  active?: boolean
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  const loadPaymentMethods = async () => {
    if (!currentOrg?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('code', { ascending: true })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar formas de pagamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPaymentMethod = async (data: CreatePaymentMethodData): Promise<boolean> => {
    if (!currentOrg?.id) return false

    try {
      // Generate next code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_next_payment_method_code', { p_org_id: currentOrg.id })

      if (codeError) throw codeError

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          org_id: currentOrg.id,
          name: data.name,
          code: codeData,
          type: data.type,
          active: data.active ?? true,
          is_default: false
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Forma de pagamento criada com sucesso",
      })

      await loadPaymentMethods()
      return true
    } catch (error) {
      console.error('Error creating payment method:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar forma de pagamento",
        variant: "destructive",
      })
      return false
    }
  }

  const updatePaymentMethod = async (id: string, data: Partial<CreatePaymentMethodData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update(data)
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Forma de pagamento atualizada com sucesso",
      })

      await loadPaymentMethods()
      return true
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar forma de pagamento",
        variant: "destructive",
      })
      return false
    }
  }

  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Forma de pagamento excluída com sucesso",
      })

      await loadPaymentMethods()
      return true
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir forma de pagamento",
        variant: "destructive",
      })
      return false
    }
  }

  const toggleActive = async (id: string, active: boolean): Promise<boolean> => {
    return updatePaymentMethod(id, { active })
  }

  const deleteMultiple = async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .in('id', ids)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `${ids.length} forma(s) de pagamento excluída(s) com sucesso.`,
      })

      await loadPaymentMethods()
      return true
    } catch (error) {
      console.error('Error deleting payment methods:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir as formas de pagamento selecionadas.",
        variant: "destructive",
      })
      return false
    }
  }

  useEffect(() => {
    loadPaymentMethods()
  }, [currentOrg?.id])

  return {
    paymentMethods,
    loading,
    loadPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
    deleteMultiple
  }
}