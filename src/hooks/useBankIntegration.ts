import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface BankIntegrationConfig {
  id: string
  bank_code: string
  bank_name: string
  agency: string
  account: string
  wallet_code: string
  agreement_number: string
  api_key?: string
  api_secret?: string
  environment: 'sandbox' | 'production'
  is_active: boolean
}

export interface BoletoData {
  entry_id: string
  beneficiary_name: string
  beneficiary_document: string
  payer_name: string
  payer_document: string
  payer_address: string
  amount: number
  due_date: string
  instructions?: string
  fine_percentage?: number
  interest_daily?: number
  discount_until?: string
  discount_amount?: number
}

export function useBankIntegration() {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [integrations, setIntegrations] = useState<BankIntegrationConfig[]>([])

  useEffect(() => {
    if (currentOrg?.id) {
      loadIntegrations()
    }
  }, [currentOrg?.id])

  const loadIntegrations = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)
      
      // Buscar configurações de integração bancária
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)

      const configs: BankIntegrationConfig[] = bankAccounts?.map(account => ({
        id: account.id,
        bank_code: account.bank_code || '001',
        bank_name: account.bank_name,
        agency: account.agency || '',
        account: account.account_number,
        wallet_code: '17', // Carteira padrão para boletos
        agreement_number: account.account_number,
        environment: 'sandbox',
        is_active: account.is_active
      })) || []

      setIntegrations(configs)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar integrações bancárias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateBoleto = async (boletoData: BoletoData, integrationId: string) => {
    try {
      setLoading(true)

      const integration = integrations.find(i => i.id === integrationId)
      if (!integration) {
        throw new Error('Integração bancária não encontrada')
      }

      // Simular geração de boleto (em produção, chamaria API do banco)
      const boletoNumber = `${integration.bank_code}${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      const barCode = generateBarCode(boletoNumber, boletoData.amount, boletoData.due_date)
      const digitableLine = formatDigitableLine(barCode)

      // Salvar dados do boleto no lançamento financeiro
      // Nota: Em produção, criar tabela específica para boletos
      const { error } = await supabase
        .from('financial_entries')
        .update({
          description: `${boletoData.beneficiary_name} - Boleto: ${digitableLine}`
        })
        .eq('id', boletoData.entry_id)

      if (error) throw error

      toast({
        title: 'Boleto gerado com sucesso',
        description: `Linha digitável: ${digitableLine}`
      })

      return {
        boleto_number: boletoNumber,
        bar_code: barCode,
        digitable_line: digitableLine,
        pdf_url: generateBoletoPDF(boletoData, digitableLine, barCode)
      }
    } catch (error) {
      console.error('Erro ao gerar boleto:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao gerar boleto',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateBarCode = (boletoNumber: string, amount: number, dueDate: string): string => {
    // Simplificação - em produção usaria algoritmo real do banco
    const bankCode = '001'
    const currency = '9'
    const dueDateFactor = calculateDueDateFactor(dueDate)
    const amountStr = Math.floor(amount * 100).toString().padStart(10, '0')
    
    return `${bankCode}${currency}${dueDateFactor}${amountStr}${boletoNumber.substr(0, 15)}`
  }

  const calculateDueDateFactor = (dueDate: string): string => {
    const base = new Date('1997-10-07')
    const due = new Date(dueDate)
    const diffDays = Math.floor((due.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays.toString().padStart(4, '0')
  }

  const formatDigitableLine = (barCode: string): string => {
    // Formatar código de barras em linha digitável
    const field1 = `${barCode.substr(0, 4)}.${barCode.substr(4, 5)}`
    const field2 = `${barCode.substr(9, 5)}.${barCode.substr(14, 6)}`
    const field3 = `${barCode.substr(20, 5)}.${barCode.substr(25, 6)}`
    const field4 = barCode.substr(31, 1)
    const field5 = barCode.substr(32, 14)
    
    return `${field1} ${field2} ${field3} ${field4} ${field5}`
  }

  const generateBoletoPDF = (data: BoletoData, digitableLine: string, barCode: string): string => {
    // Em produção, geraria PDF real do boleto
    return `data:application/pdf;base64,boleto_${data.entry_id}`
  }

  const registerBoletoPayment = async (entryId: string, paymentDate: Date, paidAmount: number) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .update({
          is_settled: true,
          settled_at: paymentDate.toISOString()
        })
        .eq('id', entryId)

      if (error) throw error

      toast({
        title: 'Pagamento registrado',
        description: 'Boleto marcado como pago'
      })
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao registrar pagamento',
        variant: 'destructive'
      })
    }
  }

  return {
    loading,
    integrations,
    generateBoleto,
    registerBoletoPayment,
    refreshIntegrations: loadIntegrations
  }
}
