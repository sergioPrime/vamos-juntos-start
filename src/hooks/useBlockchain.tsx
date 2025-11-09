import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'

interface BlockchainRecord {
  id: string
  org_id: string
  block_number: number
  previous_hash: string
  current_hash: string
  transaction_type: string
  table_name: string
  record_id: string
  data_snapshot: any
  user_id: string | null
  timestamp: string
  is_valid: boolean
  created_at: string
}

interface BlockchainStatistics {
  total_blocks: number
  valid_blocks: number
  invalid_blocks: number
  first_block_date: string | null
  last_block_date: string | null
  transaction_types: number
  unique_users: number
}

interface ValidationResult {
  is_valid: boolean
  total_blocks: number
  invalid_blocks: number
  first_invalid_block: number | null
  validation_message: string
}

export function useBlockchain() {
  const [loading, setLoading] = useState(false)
  const { currentOrg } = useOrganization()

  const getBlockchainRecords = async (filters?: {
    transactionType?: string
    limit?: number
  }): Promise<BlockchainRecord[]> => {
    if (!currentOrg?.id) {
      toast.error('Organização não encontrada')
      return []
    }

    setLoading(true)
    try {
      let query = supabase
        .from('blockchain_records')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('block_number', { ascending: false })

      if (filters?.transactionType) {
        query = query.eq('transaction_type', filters.transactionType)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar registros blockchain:', error)
      toast.error('Erro ao buscar registros blockchain')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getBlockchainStatistics = async (): Promise<BlockchainStatistics | null> => {
    if (!currentOrg?.id) {
      toast.error('Organização não encontrada')
      return null
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blockchain_statistics')
        .select('*')
        .eq('org_id', currentOrg.id)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao buscar estatísticas blockchain:', error)
      toast.error('Erro ao buscar estatísticas blockchain')
      return null
    } finally {
      setLoading(false)
    }
  }

  const validateBlockchainChain = async (): Promise<ValidationResult | null> => {
    if (!currentOrg?.id) {
      toast.error('Organização não encontrada')
      return null
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('validate_blockchain_chain', {
        p_org_id: currentOrg.id
      })

      if (error) throw error

      if (data && data.length > 0) {
        const result = data[0]
        
        if (result.is_valid) {
          toast.success('Blockchain validada com sucesso!', {
            description: result.validation_message
          })
        } else {
          toast.error('Blockchain comprometida!', {
            description: result.validation_message
          })
        }

        return result
      }

      return null
    } catch (error) {
      console.error('Erro ao validar blockchain:', error)
      toast.error('Erro ao validar blockchain')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getBlockDetails = async (blockId: string): Promise<BlockchainRecord | null> => {
    if (!currentOrg?.id) {
      toast.error('Organização não encontrada')
      return null
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blockchain_records')
        .select('*')
        .eq('id', blockId)
        .eq('org_id', currentOrg.id)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao buscar detalhes do bloco:', error)
      toast.error('Erro ao buscar detalhes do bloco')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getRecordHistory = async (recordId: string): Promise<BlockchainRecord[]> => {
    if (!currentOrg?.id) {
      toast.error('Organização não encontrada')
      return []
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blockchain_records')
        .select('*')
        .eq('record_id', recordId)
        .eq('org_id', currentOrg.id)
        .order('block_number', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico do registro:', error)
      toast.error('Erro ao buscar histórico do registro')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getBlockchainRecords,
    getBlockchainStatistics,
    validateBlockchainChain,
    getBlockDetails,
    getRecordHistory
  }
}
