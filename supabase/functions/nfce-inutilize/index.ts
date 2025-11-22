import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { signXML } from '../_shared/nfce-certificate.ts'
import { sendSoapRequest, validateSoapResponse } from '../_shared/nfce-soap-client.ts'
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

    const { serie, numeroInicial, numeroFinal, justificativa, orgId } = await req.json()

    console.log('Starting number range inutilization:', numeroInicial, '-', numeroFinal)

    // Validate justification
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres')
    }

    // Validate range
    if (numeroInicial > numeroFinal) {
      throw new Error('Número inicial deve ser menor ou igual ao número final')
    }

    if (numeroFinal - numeroInicial > 999) {
      throw new Error('Limite máximo de 1000 números por inutilização')
    }

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

    // 2. Generate inutilization XML
    const ano = new Date().getFullYear().toString().substring(2)
    const inutXml = `<?xml version="1.0" encoding="UTF-8"?>
<inutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <infInut Id="ID${fiscalConfig.uf_emitente === 'SP' ? '35' : '53'}${fiscalConfig.cnpj}${String(serie).padStart(3, '0')}${String(numeroInicial).padStart(9, '0')}${String(numeroFinal).padStart(9, '0')}">
    <tpAmb>${fiscalConfig.ambiente === 'producao' ? '1' : '2'}</tpAmb>
    <xServ>INUTILIZAR</xServ>
    <cUF>${fiscalConfig.uf_emitente === 'SP' ? '35' : '53'}</cUF>
    <ano>${ano}</ano>
    <CNPJ>${fiscalConfig.cnpj}</CNPJ>
    <mod>65</mod>
    <serie>${serie}</serie>
    <nNFIni>${numeroInicial}</nNFIni>
    <nNFFin>${numeroFinal}</nNFFin>
    <xJust>${justificativa}</xJust>
  </infInut>
</inutNFe>`

    // 3. Sign XML
    if (!fiscalConfig.certificate_pfx || !fiscalConfig.certificate_password_encrypted) {
      throw new Error('Certificado digital não configurado')
    }

    const signedXml = await signXML(inutXml, {
      pfx: fiscalConfig.certificate_pfx,
      password: fiscalConfig.certificate_password_encrypted,
    })
    console.log('Inutilization XML signed successfully')

    // 4. Send to SEFAZ
    const sefazUrl = getSefazUrl(fiscalConfig.uf, fiscalConfig.ambiente, 'NFeInutilizacao4')
    
    const soapResponse = await sendSoapRequest({
      method: 'NFeInutilizacao4',
      nfeDadosMsg: signedXml,
      url: sefazUrl,
    })

    // 5. Log transmission
    await supabaseClient.from('nfce_transmission_logs').insert({
      org_id: orgId,
      operation_type: 'inutilizacao',
      request_xml: signedXml,
      response_xml: soapResponse.data,
      status_code: soapResponse.retornoSefaz?.cStat,
      status_message: soapResponse.retornoSefaz?.xMotivo,
      protocol_number: soapResponse.retornoSefaz?.nProt,
      success: validateSoapResponse(soapResponse),
    })

    if (!validateSoapResponse(soapResponse)) {
      throw new Error(
        `SEFAZ rejeitou a inutilização: ${soapResponse.retornoSefaz?.xMotivo || 'Erro desconhecido'}`
      )
    }

    console.log('Number range inutilized successfully')

    return new Response(
      JSON.stringify({
        success: true,
        sefazResponse: soapResponse.retornoSefaz,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error inutilizing number range:', error)
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
