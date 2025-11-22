import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { nfeId, tipoManifestacao, justificativa } = await req.json()

    if (!nfeId || !tipoManifestacao) {
      throw new Error('NFe ID e tipo de manifestação são obrigatórios')
    }

    // Tipos válidos: ciencia_operacao, confirmacao_operacao, desconhecimento_operacao, operacao_nao_realizada
    const tiposValidos = ['ciencia_operacao', 'confirmacao_operacao', 'desconhecimento_operacao', 'operacao_nao_realizada']
    if (!tiposValidos.includes(tipoManifestacao)) {
      throw new Error('Tipo de manifestação inválido')
    }

    console.log(`Registrando manifestação ${tipoManifestacao} para NFe ${nfeId}`)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*, pessoas!nfe_destinatario_id_fkey(nome, documento)')
      .eq('id', nfeId)
      .single()

    if (nfeError) throw nfeError

    // Buscar dados do perfil
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('org_id')
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    // TODO: Gerar XML de manifestação
    const manifestacaoXML = `<?xml version="1.0" encoding="UTF-8"?>
<envEvento versao="1.00">
  <idLote>1</idLote>
  <evento versao="1.00">
    <infEvento Id="ID${tipoManifestacao}${nfe.chave_acesso}01">
      <cOrgao>${nfe.codigo_uf || '35'}</cOrgao>
      <tpAmb>2</tpAmb>
      <CNPJ>${nfe.pessoas?.documento || ''}</CNPJ>
      <chNFe>${nfe.chave_acesso}</chNFe>
      <dhEvento>${new Date().toISOString()}</dhEvento>
      <tpEvento>${getTipoEventoCodigo(tipoManifestacao)}</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>${getDescricaoEvento(tipoManifestacao)}</descEvento>
        ${justificativa ? `<xJust>${justificativa}</xJust>` : ''}
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`

    // TODO: Assinar XML
    const xmlAssinado = manifestacaoXML

    // TODO: Enviar para SEFAZ
    // Por enquanto, simula sucesso
    const protocolo = `999${Date.now().toString().slice(-9)}`

    // Registrar manifestação no banco
    const { error: manifestacaoError } = await supabaseClient
      .from('nfe_manifestacao')
      .insert({
        nfe_id: nfeId,
        tipo_manifestacao: tipoManifestacao,
        justificativa: justificativa || null,
        data_manifestacao: new Date().toISOString(),
        protocolo: protocolo,
        xml_manifestacao: xmlAssinado,
        org_id: profile.org_id
      })

    if (manifestacaoError) throw manifestacaoError

    // Atualizar campo na NFe
    const { error: updateError } = await supabaseClient
      .from('nfe')
      .update({
        manifestacao_destinatario: tipoManifestacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfeId)

    if (updateError) throw updateError

    console.log(`Manifestação ${tipoManifestacao} registrada com sucesso para NFe ${nfeId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manifestação registrada com sucesso',
        protocolo: protocolo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao registrar manifestação:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function getTipoEventoCodigo(tipo: string): string {
  const codigos: Record<string, string> = {
    'ciencia_operacao': '210210',
    'confirmacao_operacao': '210200',
    'desconhecimento_operacao': '210220',
    'operacao_nao_realizada': '210240'
  }
  return codigos[tipo] || '210210'
}

function getDescricaoEvento(tipo: string): string {
  const descricoes: Record<string, string> = {
    'ciencia_operacao': 'Ciencia da Operacao',
    'confirmacao_operacao': 'Confirmacao da Operacao',
    'desconhecimento_operacao': 'Desconhecimento da Operacao',
    'operacao_nao_realizada': 'Operacao nao Realizada'
  }
  return descricoes[tipo] || 'Ciencia da Operacao'
}
