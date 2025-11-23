import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { useOrganization } from './useOrganization'
import type { Database } from '@/integrations/supabase/types'

type FiscalConfig = Database['public']['Tables']['fiscal_config']['Row']
type FiscalConfigInsert = Database['public']['Tables']['fiscal_config']['Insert']
type FiscalConfigUpdate = Database['public']['Tables']['fiscal_config']['Update']

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
        .maybeSingle()

      if (error) throw error
      
      setConfig(data)
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

  const saveConfig = async (data: FiscalConfigUpdate) => {
    if (!currentOrg) return false

    try {
      if (config?.id) {
        // Update
        const { error } = await supabase
          .from('fiscal_config')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Insert - ensuring required fields
        const insertData: FiscalConfigInsert = {
          org_id: currentOrg,
          cnpj: data.cnpj || '',
          inscricao_estadual: data.inscricao_estadual || '',
          razao_social: data.razao_social || '',
          regime_tributario: data.regime_tributario || '1',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          uf_emitente: data.uf || '',
          cep: data.cep || '',
          codigo_municipio: data.codigo_municipio || '',
          serie_nfe: data.serie_nfe || '1',
          proximo_numero_nfe: data.proximo_numero_nfe || 1,
          ambiente: data.ambiente || 'homologacao',
          is_active: true,
          ...data,
        }

        const { error } = await supabase
          .from('fiscal_config')
          .insert(insertData)

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
        certificate_password_encrypted: password,
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
