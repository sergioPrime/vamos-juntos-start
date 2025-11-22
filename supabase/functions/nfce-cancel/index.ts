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

    const { nfceId, justificativa, orgId } = await req.json()

    console.log('Starting NFC-e cancellation:', nfceId)

    // Validate justification
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres')
    }

    // 1. Get NFC-e data
    const { data: nfce, error: nfceError } = await supabaseClient
      .from('nfce')
      .select('*')
      .eq('id', nfceId)
      .eq('org_id', orgId)
      .single()

    if (nfceError || !nfce) {
      throw new Error('NFC-e não encontrada')
    }

    if (nfce.status !== 'autorizada') {
      throw new Error('Apenas NFC-e autorizadas podem ser canceladas')
    }

    // Check cancellation deadline (24 hours)
    const hoursElapsed = (Date.now() - new Date(nfce.data_autorizacao).getTime()) / (1000 * 60 * 60)
    if (hoursElapsed > 24) {
      throw new Error('Prazo de cancelamento expirado (24 horas)')
    }

    // 2. Get fiscal configuration
    const { data: fiscalConfig, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single()

    if (configError || !fiscalConfig) {
      throw new Error('Configuração fiscal não encontrada')
    }

    // 3. Generate cancellation event XML
    const eventXml = `<?xml version="1.0" encoding="UTF-8"?>
<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <infEvento Id="ID110111${nfce.chave_acesso}01">
    <cOrgao>${fiscalConfig.uf_emitente === 'SP' ? '35' : '53'}</cOrgao>
    <tpAmb>${fiscalConfig.ambiente === 'producao' ? '1' : '2'}</tpAmb>
    <CNPJ>${fiscalConfig.cnpj}</CNPJ>
    <chNFe>${nfce.chave_acesso}</chNFe>
    <dhEvento>${new Date().toISOString()}</dhEvento>
    <tpEvento>110111</tpEvento>
    <nSeqEvento>1</nSeqEvento>
    <verEvento>1.00</verEvento>
    <detEvento versao="1.00">
      <descEvento>Cancelamento</descEvento>
      <nProt>${nfce.protocolo_autorizacao}</nProt>
      <xJust>${justificativa}</xJust>
    </detEvento>
  </infEvento>
</evento>`

    // 4. Sign event XML
    if (!fiscalConfig.certificate_pfx || !fiscalConfig.certificate_password_encrypted) {
      throw new Error('Certificado digital não configurado')
    }

    const signedEventXml = await signXML(eventXml, {
      pfx: fiscalConfig.certificate_pfx,
      password: fiscalConfig.certificate_password_encrypted,
    })
    console.log('Event XML signed successfully')

    // 5. Send to SEFAZ
    const sefazUrl = getSefazUrl(fiscalConfig.uf, fiscalConfig.ambiente, 'RecepcaoEvento4')
    
    const loteXml = `<?xml version="1.0" encoding="UTF-8"?>
<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>${Date.now()}</idLote>
  ${signedEventXml}
</envEvento>`

    const soapResponse = await sendSoapRequest({
      method: 'RecepcaoEvento4',
      nfeDadosMsg: loteXml,
      url: sefazUrl,
    })

    // 6. Log transmission
    await supabaseClient.from('nfce_transmission_logs').insert({
      org_id: orgId,
      nfce_id: nfceId,
      operation_type: 'cancelamento',
      request_xml: loteXml,
      response_xml: soapResponse.data,
      status_code: soapResponse.retornoSefaz?.cStat,
      status_message: soapResponse.retornoSefaz?.xMotivo,
      protocol_number: soapResponse.retornoSefaz?.nProt,
      success: validateSoapResponse(soapResponse),
    })

    if (!validateSoapResponse(soapResponse)) {
      throw new Error(
        `SEFAZ rejeitou o cancelamento: ${soapResponse.retornoSefaz?.xMotivo || 'Erro desconhecido'}`
      )
    }

    // 7. Update NFC-e status
    await supabaseClient
      .from('nfce')
      .update({
        status: 'cancelada',
        data_cancelamento: new Date().toISOString(),
        protocolo_cancelamento: soapResponse.retornoSefaz?.nProt,
        justificativa_cancelamento: justificativa,
        xml_cancelamento: signedEventXml,
      })
      .eq('id', nfceId)

    console.log('NFC-e cancelled successfully:', nfceId)

    return new Response(
      JSON.stringify({
        success: true,
        nfceId,
        sefazResponse: soapResponse.retornoSefaz,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error cancelling NFC-e:', error)
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
