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

    const { nfeId } = await req.json()

    if (!nfeId) {
      throw new Error('ID da NFe é obrigatório')
    }

    console.log(`Consultando status da NFe ${nfeId}`)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError) throw nfeError

    // TODO: Implementar consulta real no SEFAZ
    // Por enquanto, simula uma resposta
    const consultaResult = {
      status: 'autorizada',
      protocolo: '135240000000001',
      dataAutorizacao: new Date().toISOString(),
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00">
  <NFe>
    <infNFe Id="NFe${nfe.chave_acesso}">
      <ide>
        <cUF>${nfe.codigo_uf || '35'}</cUF>
        <nNF>${nfe.numero}</nNF>
        <serie>${nfe.serie || '1'}</serie>
        <dhEmi>${nfe.data_emissao}</dhEmi>
      </ide>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>SVRS202501</verAplic>
      <chNFe>${nfe.chave_acesso}</chNFe>
      <dhRecbto>${new Date().toISOString()}</dhRecbto>
      <nProt>135240000000001</nProt>
      <digVal>hash_validacao_aqui</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`
    }

    // Atualizar status da NFe no banco
    const { error: updateError } = await supabaseClient
      .from('nfe')
      .update({
        status: consultaResult.status,
        protocolo_autorizacao: consultaResult.protocolo,
        data_autorizacao: consultaResult.dataAutorizacao,
        xml_autorizado: consultaResult.xml,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfeId)

    if (updateError) throw updateError

    console.log(`Status da NFe ${nfeId} consultado com sucesso`)

    return new Response(
      JSON.stringify({
        success: true,
        status: consultaResult.status,
        protocolo: consultaResult.protocolo,
        dataAutorizacao: consultaResult.dataAutorizacao
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao consultar status:', error)
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
