import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSoapRequest } from '../_shared/nfce-soap-client.ts'
import { getSefazUrl } from '../_shared/nfce-sefaz-urls.ts'

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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Não autenticado')
    }

    const { chaveAcesso, orgId } = await req.json()

    console.log('Querying NFC-e status:', chaveAcesso)

    // 1. Get fiscal configuration
    const { data: fiscalConfig, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single()

    if (configError || !fiscalConfig) {
      throw new Error('Configuração fiscal não encontrada')
    }

    // 2. Generate query XML
    const queryXml = `<?xml version="1.0" encoding="UTF-8"?>
<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${fiscalConfig.ambiente === 'producao' ? '1' : '2'}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${chaveAcesso}</chNFe>
</consSitNFe>`

    // 3. Send to SEFAZ
    const sefazUrl = getSefazUrl(fiscalConfig.uf, fiscalConfig.ambiente, 'NFeConsultaProtocolo4')
    
    const soapResponse = await sendSoapRequest({
      method: 'NFeConsultaProtocolo4',
      nfeDadosMsg: queryXml,
      url: sefazUrl,
    })

    // 4. Log transmission
    await supabaseClient.from('nfce_transmission_logs').insert({
      org_id: orgId,
      operation_type: 'consulta',
      request_xml: queryXml,
      response_xml: soapResponse.data,
      status_code: soapResponse.retornoSefaz?.cStat,
      status_message: soapResponse.retornoSefaz?.xMotivo,
      protocol_number: soapResponse.retornoSefaz?.nProt,
      success: soapResponse.success,
    })

    if (!soapResponse.success) {
      throw new Error(
        `SEFAZ retornou erro: ${soapResponse.retornoSefaz?.xMotivo || 'Erro desconhecido'}`
      )
    }

    console.log('NFC-e status queried successfully')

    return new Response(
      JSON.stringify({
        success: true,
        status: soapResponse.retornoSefaz,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error querying NFC-e status:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
