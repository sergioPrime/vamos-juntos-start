import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'

export interface FiscalConfig {
  id?: string
  org_id: string
  cnpj?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  razao_social?: string
  nome_fantasia?: string
  regime_tributario?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  telefone?: string
  email?: string
  
  // Certificado Digital
  certificate_pfx?: string
  certificate_password?: string
  certificate_expires_at?: string
  
  // CSC (Código de Segurança do Contribuinte)
  csc_producao?: string
  csc_id_producao?: string
  csc_homologacao?: string
  csc_id_homologacao?: string
  
  // Configurações NFe/NFCe
  ambiente?: 'producao' | 'homologacao'
  serie_nfe?: string
  serie_nfce?: string
  proximo_numero_nfe?: number
  proximo_numero_nfce?: number
  
  // Configurações NFSe
  serie_nfse?: string
  proximo_numero_nfse?: number
  codigo_tributacao_municipio?: string
  item_lista_servico?: string
  
  // Contingência
  contingencia_ativa?: boolean
  motivo_contingencia?: string
  data_inicio_contingencia?: string
  
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export function useFiscalConfig() {
  const [config, setConfig] = useState<FiscalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { currentOrg } = useOrganization()

  const loadConfig = async () => {
    if (!currentOrg) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('org_id', currentOrg)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      setConfig(data || null)
    } catch (error) {
      console.error('Error loading fiscal config:', error)
      toast({
        title: "Erro ao carregar configuração",
        description: "Não foi possível carregar a configuração fiscal.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (data: Partial<FiscalConfig>) => {
    if (!currentOrg) return

    try {
      if (config?.id) {
        // Update
        const { error } = await supabase
          .from('fiscal_config')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('fiscal_config')
          .insert({ ...data, org_id: currentOrg, is_active: true })

        if (error) throw error
      }

      toast({
        title: "Configuração salva",
        description: "As configurações fiscais foram salvas com sucesso.",
      })

      await loadConfig()
      return true
    } catch (error) {
      console.error('Error saving fiscal config:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração fiscal.",
        variant: "destructive",
      })
      return false
    }
  }

  const uploadCertificate = async (file: File, password: string) => {
    if (!currentOrg) return false

    try {
      // Converter arquivo para base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64 = await base64Promise
      
      // Extrair data de validade (isso seria feito no backend em produção)
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // Placeholder

      const success = await saveConfig({
        certificate_pfx: base64,
        certificate_password: password,
        certificate_expires_at: expiresAt.toISOString(),
      })

      return success
    } catch (error) {
      console.error('Error uploading certificate:', error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do certificado.",
        variant: "destructive",
      })
      return false
    }
  }

  useEffect(() => {
    loadConfig()
  }, [currentOrg])

  return {
    config,
    loading,
    saveConfig,
    uploadCertificate,
    refetch: loadConfig,
  }
}
