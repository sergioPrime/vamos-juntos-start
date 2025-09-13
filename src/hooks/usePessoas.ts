import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
// import { useOrganization } from './useOrganization'

export interface Pessoa {
  id: string
  nome_fantasia: string
  razao_social?: string
  tipo_pessoa: 'fisica' | 'juridica'
  documento: string
  codigo?: string
  endereco?: string
  cidade?: string
  uf?: string
  cep?: string
  email_geral?: string
  emails_secundarios?: string[]
  telefone?: string
  telefone_celular?: string
  whatsapps?: string[]
  bloquear_notificacoes_whatsapp?: boolean
  vendedor_padrao?: string
  transportadora_padrao?: string
  rotulos?: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export function usePessoas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  // const { currentOrganization } = useOrganization()
  const [currentOrganization, setCurrentOrganization] = useState<{ id: string } | null>(null)

  const fetchPessoas = async () => {
    if (!user || !currentOrganization) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .eq('org_id', currentOrganization?.id || '')
        .order('nome_fantasia')

      if (error) throw error
      setPessoas((data || []).map(item => ({
        ...item,
        tipo_pessoa: item.tipo_pessoa as 'fisica' | 'juridica'
      })))
    } catch (err) {
      console.error('Error fetching pessoas:', err)
      setError(err instanceof Error ? err.message : 'Error fetching pessoas')
    } finally {
      setLoading(false)
    }
  }

  const createPessoa = async (pessoaData: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !currentOrganization) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('pessoas')
        .insert([{
          ...pessoaData,
          org_id: currentOrganization.id,
          created_by: user.id
        }])
        .select()
        .single()

      if (error) throw error
      
      setPessoas(prev => [...prev, { ...data, tipo_pessoa: data.tipo_pessoa as 'fisica' | 'juridica' }])
      return data
    } catch (err) {
      console.error('Error creating pessoa:', err)
      throw err
    }
  }

  const updatePessoa = async (id: string, pessoaData: Partial<Pessoa>) => {
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .update(pessoaData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setPessoas(prev => prev.map(p => p.id === id ? { ...data, tipo_pessoa: data.tipo_pessoa as 'fisica' | 'juridica' } : p))
      return data
    } catch (err) {
      console.error('Error updating pessoa:', err)
      throw err
    }
  }

  const deletePessoa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pessoas')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setPessoas(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting pessoa:', err)
      throw err
    }
  }

  useEffect(() => {
    // Mock organization for now
    setCurrentOrganization({ id: 'mock-org-id' })
  }, [])

  useEffect(() => {
    if (currentOrganization) {
      fetchPessoas()
    }
  }, [user, currentOrganization])

  return {
    pessoas,
    loading,
    error,
    fetchPessoas,
    createPessoa,
    updatePessoa,
    deletePessoa
  }
}