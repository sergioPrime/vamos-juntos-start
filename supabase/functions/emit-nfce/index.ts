import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFCeData {
  org_id: string
  serie?: number
  destinatario_cpf?: string
  destinatario_nome?: string
  items: Array<{
    codigo_produto: string
    descricao: string
    ncm: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    icms_situacao_tributaria: string
  }>
  valor_produtos: number
  valor_desconto?: number
  valor_total: number
  order_id?: string
  tipo_emissao?: 'normal' | 'contingencia'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: nfceData, tipo_emissao = 'normal' } = await req.json() as { data: NFCeData, tipo_emissao?: string }

    console.log('[emit-nfce] Iniciando emissão:', { org_id: nfceData.org_id, tipo_emissao })

    // Obter configuração fiscal
    const { data: fiscalConfig, error: configError } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('org_id', nfceData.org_id)
      .single()

    if (configError || !fiscalConfig) {
      throw new Error('Configuração fiscal não encontrada')
    }

    // Obter próximo número da NFC-e
    const { data: nextNumber, error: numberError } = await supabase
      .rpc('get_next_nfce_number', { 
        p_org_id: nfceData.org_id,
        p_serie: nfceData.serie || fiscalConfig.nfce_serie || 1
      })

    if (numberError) {
      console.error('[emit-nfce] Erro ao obter próximo número:', numberError)
      throw new Error('Erro ao obter numeração')
    }

    const numero = nextNumber as number
    const serie = nfceData.serie || fiscalConfig.nfce_serie || 1

    console.log('[emit-nfce] Número obtido:', { numero, serie })

    // Gerar chave de acesso (simplificada para exemplo)
    const uf = fiscalConfig.codigo_municipio?.substring(0, 2) || '35'
    const dataEmissao = new Date()
    const cnpj = fiscalConfig.cnpj || '00000000000000'
    const modelo = '65' // NFC-e
    const tipoEmissaoCode = tipo_emissao === 'contingencia' ? '9' : '1'
    const codigoNumerico = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')

    const chaveAcesso = `${uf}${dataEmissao.getFullYear().toString().slice(-2)}${(dataEmissao.getMonth() + 1).toString().padStart(2, '0')}${cnpj}${modelo}${serie.toString().padStart(3, '0')}${numero.toString().padStart(9, '0')}${tipoEmissaoCode}${codigoNumerico}`

    // Criar registro da NFC-e
    const { data: nfce, error: nfceError } = await supabase
      .from('nfce')
      .insert({
        org_id: nfceData.org_id,
        numero,
        serie,
        chave_acesso: chaveAcesso,
        status: tipo_emissao === 'contingencia' ? 'processando' : 'processando',
        tipo_emissao,
        destinatario_cpf: nfceData.destinatario_cpf,
        destinatario_nome: nfceData.destinatario_nome,
        valor_produtos: nfceData.valor_produtos,
        valor_desconto: nfceData.valor_desconto || 0,
        valor_total: nfceData.valor_total,
        order_id: nfceData.order_id,
        sincronizado: tipo_emissao === 'normal'
      })
      .select()
      .single()

    if (nfceError) {
      console.error('[emit-nfce] Erro ao criar NFC-e:', nfceError)
      throw new Error('Erro ao criar registro de NFC-e')
    }

    // Inserir itens
    const itemsToInsert = nfceData.items.map((item, index) => ({
      nfce_id: nfce.id,
      ordem: index + 1,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      ncm: item.ncm,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
      icms_situacao_tributaria: item.icms_situacao_tributaria
    }))

    const { error: itemsError } = await supabase
      .from('nfce_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('[emit-nfce] Erro ao inserir itens:', itemsError)
      throw new Error('Erro ao inserir itens da NFC-e')
    }

    // Simular envio para SEFAZ
    if (tipo_emissao === 'normal') {
      // Em produção, aqui seria feita a comunicação real com a SEFAZ
      // Por enquanto, vamos simular uma aprovação
      const protocolo = `${Date.now()}`
      
      const { error: updateError } = await supabase
        .from('nfce')
        .update({
          status: 'autorizada',
          protocolo,
          data_autorizacao: new Date().toISOString()
        })
        .eq('id', nfce.id)

      if (updateError) {
        console.error('[emit-nfce] Erro ao atualizar status:', updateError)
      }

      console.log('[emit-nfce] NFC-e autorizada:', { id: nfce.id, protocolo })

      return new Response(
        JSON.stringify({
          success: true,
          nfce: {
            ...nfce,
            status: 'autorizada',
            protocolo
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Modo contingência - adicionar à fila
      const { error: queueError } = await supabase
        .from('nfce_contingencia_queue')
        .insert({
          org_id: nfceData.org_id,
          nfce_id: nfce.id,
          data_emissao: new Date().toISOString()
        })

      if (queueError) {
        console.error('[emit-nfce] Erro ao adicionar à fila:', queueError)
      }

      console.log('[emit-nfce] NFC-e em contingência:', { id: nfce.id })

      return new Response(
        JSON.stringify({
          success: true,
          contingency: true,
          nfce
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('[emit-nfce] Erro:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})