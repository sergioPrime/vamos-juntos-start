import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateNFCeXML } from '../_shared/nfce-xml-generator.ts'
import { generateQRCode } from '../_shared/nfce-qrcode-generator.ts'
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

    const { nfceData, orgId } = await req.json()

    console.log('Starting NFC-e authorization for org:', orgId)

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

    // 2. Validate configuration
    const { data: validation } = await supabaseClient
      .rpc('validate_nfce_emission', { p_org_id: orgId })

    if (!validation?.[0]?.is_valid) {
      const errors = validation?.[0]?.errors || ['Configuração fiscal inválida']
      throw new Error(errors.join('; '))
    }

    // 3. Generate XML
    const xmlData = {
      ...nfceData,
      emitente: {
        cnpj: fiscalConfig.cnpj,
        razaoSocial: fiscalConfig.razao_social,
        nomeFantasia: fiscalConfig.nome_fantasia,
        ie: fiscalConfig.inscricao_estadual,
        crt: fiscalConfig.regime_tributario,
        endereco: {
          logradouro: fiscalConfig.logradouro,
          numero: fiscalConfig.numero,
          complemento: fiscalConfig.complemento,
          bairro: fiscalConfig.bairro,
          codigoMunicipio: fiscalConfig.codigo_municipio,
          municipio: fiscalConfig.municipio,
          uf: fiscalConfig.uf,
          cep: fiscalConfig.cep,
        },
      },
      serie: fiscalConfig.serie_nfce || '1',
      numero: fiscalConfig.proximo_numero_nfce || 1,
      ambiente: fiscalConfig.ambiente,
    }

    const xml = generateNFCeXML(xmlData)
    console.log('XML generated successfully')

    // 4. Sign XML
    if (!fiscalConfig.certificate_pfx || !fiscalConfig.certificate_password_encrypted) {
      throw new Error('Certificado digital não configurado')
    }

    const signedXml = await signXML(xml, {
      pfx: fiscalConfig.certificate_pfx,
      password: fiscalConfig.certificate_password_encrypted, // Should be decrypted in production
    })
    console.log('XML signed successfully')

    // 5. Generate QR Code
    const csc = fiscalConfig.ambiente === 'producao' 
      ? fiscalConfig.csc_producao 
      : fiscalConfig.csc_homologacao
    const cscId = fiscalConfig.ambiente === 'producao'
      ? fiscalConfig.csc_id_producao
      : fiscalConfig.csc_id_homologacao

    if (!csc || !cscId) {
      throw new Error('CSC não configurado')
    }

    const qrCodeUrl = await generateQRCode({
      chaveAcesso: xmlData.chaveAcesso,
      ambiente: fiscalConfig.ambiente,
      csc,
      cscId,
      valorTotal: xmlData.total,
      dataEmissao: xmlData.dataEmissao,
    })
    console.log('QR Code generated:', qrCodeUrl)

    // 6. Send to SEFAZ
    const sefazUrl = getSefazUrl(fiscalConfig.uf, fiscalConfig.ambiente, 'NFeAutorizacao4')
    
    const loteXml = `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${Date.now()}</idLote>
  <indSinc>1</indSinc>
  ${signedXml}
</enviNFe>`

    const soapResponse = await sendSoapRequest({
      method: 'NFeAutorizacao4',
      nfeDadosMsg: loteXml,
      url: sefazUrl,
    })

    // 7. Log transmission
    await supabaseClient.from('nfce_transmission_logs').insert({
      org_id: orgId,
      operation_type: 'autorizacao',
      request_xml: loteXml,
      response_xml: soapResponse.data,
      status_code: soapResponse.retornoSefaz?.cStat,
      status_message: soapResponse.retornoSefaz?.xMotivo,
      protocol_number: soapResponse.retornoSefaz?.nProt,
      success: validateSoapResponse(soapResponse),
    })

    if (!validateSoapResponse(soapResponse)) {
      throw new Error(
        `SEFAZ rejeitou a NFC-e: ${soapResponse.retornoSefaz?.xMotivo || 'Erro desconhecido'}`
      )
    }

    // 8. Update next number
    await supabaseClient
      .from('fiscal_config')
      .update({
        proximo_numero_nfce: (fiscalConfig.proximo_numero_nfce || 1) + 1,
      })
      .eq('id', fiscalConfig.id)

    // 9. Save NFC-e
    const { data: nfce, error: nfceError } = await supabaseClient
      .from('nfce')
      .insert({
        org_id: orgId,
        numero: xmlData.numero,
        serie: xmlData.serie,
        chave_acesso: xmlData.chaveAcesso,
        protocolo_autorizacao: soapResponse.retornoSefaz?.nProt,
        data_autorizacao: soapResponse.retornoSefaz?.dhRecbto,
        xml_assinado: signedXml,
        qrcode_url: qrCodeUrl,
        status: 'autorizada',
        modelo: '65',
        ...nfceData,
      })
      .select()
      .single()

    if (nfceError) throw nfceError

    console.log('NFC-e authorized successfully:', nfce.id)

    return new Response(
      JSON.stringify({
        success: true,
        nfce,
        sefazResponse: soapResponse.retornoSefaz,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error authorizing NFC-e:', error)
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
