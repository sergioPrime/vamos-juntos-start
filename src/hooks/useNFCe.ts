import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

interface NFCeItem {
  codigo_produto: string
  descricao: string
  ncm: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  icms_situacao_tributaria: string
}

interface NFCeData {
  org_id: string
  serie?: number
  destinatario_cpf?: string
  destinatario_nome?: string
  items: NFCeItem[]
  valor_produtos: number
  valor_desconto?: number
  valor_total: number
  order_id?: string
}

export function useNFCe() {
  const { toast } = useToast()
  const [isEmitting, setIsEmitting] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const emitNFCe = async (data: NFCeData, tipoEmissao: 'normal' | 'contingencia' = 'normal') => {
    setIsEmitting(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('emit-nfce', {
        body: { data, tipo_emissao: tipoEmissao }
      })

      if (error) throw error

      if (result.success) {
        toast({
          title: tipoEmissao === 'normal' ? 'NFC-e emitida com sucesso' : 'NFC-e em contingência',
          description: tipoEmissao === 'normal' 
            ? `Número: ${result.nfce.numero} - Protocolo: ${result.nfce.protocolo}`
            : `NFC-e será sincronizada automaticamente quando possível`,
        })
        return result.nfce
      } else {
        throw new Error(result.error || 'Erro ao emitir NFC-e')
      }
    } catch (error) {
      console.error('Error emitting NFC-e:', error)
      toast({
        title: 'Erro ao emitir NFC-e',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsEmitting(false)
    }
  }

  const cancelNFCe = async (nfceId: string, motivo: string) => {
    if (!motivo || motivo.length < 15) {
      toast({
        title: 'Motivo inválido',
        description: 'O motivo de cancelamento deve ter no mínimo 15 caracteres',
        variant: 'destructive',
      })
      return false
    }

    setIsCanceling(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('cancel-nfce', {
        body: { nfce_id: nfceId, motivo }
      })

      if (error) throw error

      if (result.success) {
        toast({
          title: 'NFC-e cancelada',
          description: 'O cancelamento foi processado com sucesso',
        })
        return true
      } else {
        throw new Error(result.error || 'Erro ao cancelar NFC-e')
      }
    } catch (error) {
      console.error('Error canceling NFC-e:', error)
      toast({
        title: 'Erro ao cancelar NFC-e',
        description: error.message,
        variant: 'destructive',
      })
      return false
    } finally {
      setIsCanceling(false)
    }
  }

  const queryNFCeStatus = async (chaveAcesso: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('query-nfce-status', {
        body: { chave_acesso: chaveAcesso }
      })

      if (error) throw error

      if (result.success) {
        return result.nfce
      } else {
        throw new Error(result.error || 'Erro ao consultar NFC-e')
      }
    } catch (error) {
      console.error('Error querying NFC-e:', error)
      toast({
        title: 'Erro ao consultar NFC-e',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const inutilizeRange = async (inicio: number, fim: number, serie: number, orgId: string) => {
    // Placeholder - implementar quando necessário
    console.log('Inutilizar faixa:', { inicio, fim, serie, orgId })
    toast({
      title: 'Função em desenvolvimento',
      description: 'A inutilização de numeração será implementada em breve',
    })
  }

  return {
    emitNFCe,
    cancelNFCe,
    queryNFCeStatus,
    inutilizeRange,
    isEmitting,
    isCanceling
  }
}
