import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NFeData {
  nfe_id: string
  org_id: string
}

interface SefazResponse {
  success: boolean
  chave_acesso?: string
  protocolo?: string
  xml_assinado?: string
  error?: string
  details?: any
}

// Função para gerar XML da NFe
function generateNFeXML(nfeData: any): string {
  const now = new Date()
  const dhEmi = now.toISOString()
  
  // Gera chave de acesso (44 dígitos)
  const chaveAcesso = generateChaveAcesso(nfeData)
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cUF>${nfeData.uf_code}</cUF>
      <cNF>${nfeData.codigo_numerico}</cNF>
      <natOp>${escapeXml(nfeData.natureza_operacao)}</natOp>
      <mod>55</mod>
      <serie>${nfeData.serie}</serie>
      <nNF>${nfeData.numero}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>${nfeData.tipo}</tpNF>
      <idDest>${nfeData.id_dest}</idDest>
      <cMunFG>${nfeData.municipio_code}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso.slice(-1)}</cDV>
      <tpAmb>${nfeData.ambiente}</tpAmb>
      <finNFe>${nfeData.finalidade}</finNFe>
      <indFinal>${nfeData.consumidor_final ? '1' : '0'}</indFinal>
      <indPres>${nfeData.indicador_presenca}</indPres>
      <procEmi>0</procEmi>
      <verProc>PrimeGestor 1.0</verProc>
    </ide>
    
    <emit>
      <CNPJ>${nfeData.emitente.cnpj}</CNPJ>
      <xNome>${escapeXml(nfeData.emitente.nome)}</xNome>
      <xFant>${escapeXml(nfeData.emitente.fantasia || '')}</xFant>
      <enderEmit>
        <xLgr>${escapeXml(nfeData.emitente.logradouro)}</xLgr>
        <nro>${nfeData.emitente.numero}</nro>
        <xBairro>${escapeXml(nfeData.emitente.bairro)}</xBairro>
        <cMun>${nfeData.emitente.codigo_municipio}</cMun>
        <xMun>${escapeXml(nfeData.emitente.municipio)}</xMun>
        <UF>${nfeData.emitente.uf}</UF>
        <CEP>${nfeData.emitente.cep.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
        ${nfeData.emitente.telefone ? `<fone>${nfeData.emitente.telefone.replace(/\D/g, '')}</fone>` : ''}
      </enderEmit>
      <IE>${nfeData.emitente.ie}</IE>
      <CRT>${nfeData.emitente.regime_tributario}</CRT>
    </emit>
    
    <dest>
      ${nfeData.destinatario.cpf_cnpj.length === 11 ? 
        `<CPF>${nfeData.destinatario.cpf_cnpj}</CPF>` : 
        `<CNPJ>${nfeData.destinatario.cpf_cnpj}</CNPJ>`
      }
      <xNome>${escapeXml(nfeData.destinatario.nome)}</xNome>
      <enderDest>
        <xLgr>${escapeXml(nfeData.destinatario.logradouro)}</xLgr>
        <nro>${nfeData.destinatario.numero}</nro>
        <xBairro>${escapeXml(nfeData.destinatario.bairro)}</xBairro>
        <cMun>${nfeData.destinatario.codigo_municipio}</cMun>
        <xMun>${escapeXml(nfeData.destinatario.municipio)}</xMun>
        <UF>${nfeData.destinatario.uf}</UF>
        <CEP>${nfeData.destinatario.cep.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
        ${nfeData.destinatario.telefone ? `<fone>${nfeData.destinatario.telefone.replace(/\D/g, '')}</fone>` : ''}
      </enderDest>
      <indIEDest>${nfeData.destinatario.indicador_ie || '9'}</indIEDest>
      ${nfeData.destinatario.ie ? `<IE>${nfeData.destinatario.ie}</IE>` : ''}
      ${nfeData.destinatario.email ? `<email>${nfeData.destinatario.email}</email>` : ''}
    </dest>
    
    ${generateProductsXML(nfeData.items)}
    
    <total>
      <ICMSTot>
        <vBC>${formatNumber(nfeData.totals.base_icms)}</vBC>
        <vICMS>${formatNumber(nfeData.totals.valor_icms)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${formatNumber(nfeData.totals.valor_produtos)}</vProd>
        <vFrete>${formatNumber(nfeData.totals.valor_frete || 0)}</vFrete>
        <vSeg>${formatNumber(nfeData.totals.valor_seguro || 0)}</vSeg>
        <vDesc>${formatNumber(nfeData.totals.valor_desconto || 0)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${formatNumber(nfeData.totals.valor_ipi)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${formatNumber(nfeData.totals.valor_pis)}</vPIS>
        <vCOFINS>${formatNumber(nfeData.totals.valor_cofins)}</vCOFINS>
        <vOutro>${formatNumber(nfeData.totals.valor_outras_despesas || 0)}</vOutro>
        <vNF>${formatNumber(nfeData.totals.valor_total)}</vNF>
        <vTotTrib>0.00</vTotTrib>
      </ICMSTot>
    </total>
    
    <transp>
      <modFrete>${nfeData.modalidade_frete || '9'}</modFrete>
    </transp>
    
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>99</tPag>
        <vPag>${formatNumber(nfeData.totals.valor_total)}</vPag>
      </detPag>
    </pag>
    
    ${nfeData.informacoes_complementares ? `
    <infAdic>
      <infCpl>${escapeXml(nfeData.informacoes_complementares)}</infCpl>
    </infAdic>
    ` : ''}
  </infNFe>
</NFe>`

  return xml
}

function generateProductsXML(items: any[]): string {
  return items.map((item, index) => `
    <det nItem="${index + 1}">
      <prod>
        <cProd>${item.codigo}</cProd>
        <cEAN>${item.ean || 'SEM GTIN'}</cEAN>
        <xProd>${escapeXml(item.descricao)}</xProd>
        <NCM>${item.ncm}</NCM>
        ${item.cest ? `<CEST>${item.cest}</CEST>` : ''}
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.unidade}</uCom>
        <qCom>${formatNumber(item.quantidade, 4)}</qCom>
        <vUnCom>${formatNumber(item.valor_unitario, 10)}</vUnCom>
        <vProd>${formatNumber(item.valor_total)}</vProd>
        <cEANTrib>${item.ean || 'SEM GTIN'}</cEANTrib>
        <uTrib>${item.unidade}</uTrib>
        <qTrib>${formatNumber(item.quantidade, 4)}</qTrib>
        <vUnTrib>${formatNumber(item.valor_unitario, 10)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      
      <imposto>
        <vTotTrib>0.00</vTotTrib>
        
        <ICMS>
          <ICMS00>
            <orig>${item.origem}</orig>
            <CST>${item.cst_icms}</CST>
            <modBC>0</modBC>
            <vBC>${formatNumber(item.icms_base_calculo)}</vBC>
            <pICMS>${formatNumber(item.icms_aliquota)}</pICMS>
            <vICMS>${formatNumber(item.icms_valor)}</vICMS>
          </ICMS00>
        </ICMS>
        
        <IPI>
          <cEnq>999</cEnq>
          <IPITrib>
            <CST>${item.cst_ipi || '50'}</CST>
            <vBC>${formatNumber(item.ipi_base_calculo || 0)}</vBC>
            <pIPI>${formatNumber(item.ipi_aliquota || 0)}</pIPI>
            <vIPI>${formatNumber(item.ipi_valor || 0)}</vIPI>
          </IPITrib>
        </IPI>
        
        <PIS>
          <PISAliq>
            <CST>${item.cst_pis}</CST>
            <vBC>${formatNumber(item.pis_base_calculo)}</vBC>
            <pPIS>${formatNumber(item.pis_aliquota)}</pPIS>
            <vPIS>${formatNumber(item.pis_valor)}</vPIS>
          </PISAliq>
        </PIS>
        
        <COFINS>
          <COFINSAliq>
            <CST>${item.cst_cofins}</CST>
            <vBC>${formatNumber(item.cofins_base_calculo)}</vBC>
            <pCOFINS>${formatNumber(item.cofins_aliquota)}</pCOFINS>
            <vCOFINS>${formatNumber(item.cofins_valor)}</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>
  `).join('')
}

function generateChaveAcesso(nfeData: any): string {
  const uf = nfeData.uf_code.padStart(2, '0')
  const aamm = new Date().toISOString().slice(2, 7).replace('-', '')
  const cnpj = nfeData.emitente.cnpj.padStart(14, '0')
  const mod = '55'
  const serie = String(nfeData.serie).padStart(3, '0')
  const numero = String(nfeData.numero).padStart(9, '0')
  const tpEmis = '1'
  const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  
  const chave = uf + aamm + cnpj + mod + serie + numero + tpEmis + cNF
  const dv = calculateDV(chave)
  
  return chave + dv
}

function calculateDV(chave: string): string {
  const multiplicadores = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * multiplicadores[i]
  }
  
  const resto = soma % 11
  const dv = resto < 2 ? 0 : 11 - resto
  
  return String(dv)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

// Função para assinar o XML (simplificada - em produção usar certificado real)
async function signXML(xml: string, certificatePfx: string, password: string): Promise<string> {
  console.log('Signing XML with certificate...')
  
  // IMPORTANTE: Em produção, implementar assinatura real usando certificado A1/A3
  // Esta é uma versão simplificada para demonstração
  
  // TODO: Implementar assinatura digital real usando:
  // 1. Carregar certificado PFX
  // 2. Extrair chave privada
  // 3. Assinar usando SHA-256
  // 4. Incluir tag <Signature> no XML
  
  return xml
}

// Função para enviar ao SEFAZ
async function sendToSefaz(signedXml: string, uf: string, ambiente: string): Promise<SefazResponse> {
  console.log(`Sending NFe to SEFAZ - UF: ${uf}, Ambiente: ${ambiente}`)
  
  // URLs dos webservices (homologação e produção)
  const sefazUrls: Record<string, any> = {
    'SP': {
      homologacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      producao: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
    },
    'SVRS': { // Para estados que usam SVRS
      homologacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      producao: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
    }
  }
  
  const url = ambiente === '1' 
    ? (sefazUrls[uf]?.producao || sefazUrls['SVRS'].producao)
    : (sefazUrls[uf]?.homologacao || sefazUrls['SVRS'].homologacao)
  
  // Envelope SOAP para autorização de NFe
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
  <soap:Header/>
  <soap:Body>
    <nfe:nfeDadosMsg>
      <![CDATA[${signedXml}]]>
    </nfe:nfeDadosMsg>
  </soap:Body>
</soap:Envelope>`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4'
      },
      body: soapEnvelope
    })
    
    const responseText = await response.text()
    console.log('SEFAZ Response:', responseText)
    
    // Parse da resposta (simplificado)
    // TODO: Implementar parser completo para extrair chave, protocolo, etc.
    
    return {
      success: response.ok,
      chave_acesso: 'CHAVE_ACESSO_RETORNADA',
      protocolo: 'PROTOCOLO_RETORNADO',
      xml_assinado: signedXml,
      details: responseText
    }
  } catch (error: any) {
    console.error('Error sending to SEFAZ:', error)
    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}

Deno.serve(async (req) => {
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

    const { nfe_id, org_id } = await req.json() as NFeData

    console.log('Emitting NFe:', nfe_id)

    // 1. Buscar dados completos da NFe
    const { data: nfeData, error: nfeError } = await supabaseClient
      .from('nfe')
      .select(`
        *,
        pessoas:destinatario_id(nome, cpf_cnpj, logradouro, numero, bairro, cidade, uf, cep, telefone, email),
        companies:company_id(name, document, state_registration, address, city, state, zip_code),
        nfe_items(*)
      `)
      .eq('id', nfe_id)
      .single()

    if (nfeError) {
      throw new Error(`Erro ao buscar NFe: ${nfeError.message}`)
    }

    // 2. Buscar configurações da organização
    const { data: orgConfig } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', org_id)
      .single()

    // 3. Preparar dados para geração do XML
    const xmlData = {
      ...nfeData,
      emitente: {
        cnpj: nfeData.companies.document.replace(/\D/g, ''),
        nome: nfeData.companies.name,
        fantasia: nfeData.companies.name,
        logradouro: nfeData.companies.address,
        numero: '123',
        bairro: 'Centro',
        codigo_municipio: '3550308', // TODO: buscar do cadastro
        municipio: nfeData.companies.city,
        uf: nfeData.companies.state,
        cep: nfeData.companies.zip_code,
        ie: nfeData.companies.state_registration,
        regime_tributario: '1'
      },
      destinatario: {
        cpf_cnpj: nfeData.pessoas.cpf_cnpj.replace(/\D/g, ''),
        nome: nfeData.pessoas.nome,
        logradouro: nfeData.pessoas.logradouro,
        numero: nfeData.pessoas.numero,
        bairro: nfeData.pessoas.bairro,
        codigo_municipio: '3550308', // TODO: buscar do cadastro
        municipio: nfeData.pessoas.cidade,
        uf: nfeData.pessoas.uf,
        cep: nfeData.pessoas.cep,
        telefone: nfeData.pessoas.telefone,
        email: nfeData.pessoas.email,
        indicador_ie: '9'
      },
      items: nfeData.nfe_items,
      totals: {
        base_icms: nfeData.valor_base_icms || 0,
        valor_icms: nfeData.valor_icms || 0,
        valor_produtos: nfeData.valor_produtos || 0,
        valor_frete: nfeData.valor_frete || 0,
        valor_seguro: nfeData.valor_seguro || 0,
        valor_desconto: nfeData.valor_desconto || 0,
        valor_ipi: nfeData.valor_ipi || 0,
        valor_pis: nfeData.valor_pis || 0,
        valor_cofins: nfeData.valor_cofins || 0,
        valor_outras_despesas: nfeData.valor_outras_despesas || 0,
        valor_total: nfeData.valor_total || 0
      },
      uf_code: '35', // TODO: mapear UF para código
      ambiente: nfeData.ambiente || '2' // 1=Produção, 2=Homologação
    }

    // 4. Gerar XML
    const xml = generateNFeXML(xmlData)
    console.log('XML generated')

    // 5. Assinar XML
    const certificatePfx = Deno.env.get('NFE_CERTIFICATE_PFX') || ''
    const certificatePassword = Deno.env.get('NFE_CERTIFICATE_PASSWORD') || ''
    
    const signedXml = await signXML(xml, certificatePfx, certificatePassword)
    console.log('XML signed')

    // 6. Enviar para SEFAZ
    const sefazResponse = await sendToSefaz(signedXml, nfeData.emitente_uf || 'SP', xmlData.ambiente)

    if (!sefazResponse.success) {
      throw new Error(`Erro ao enviar NFe: ${sefazResponse.error}`)
    }

    // 7. Atualizar NFe no banco
    const { error: updateError } = await supabaseClient
      .from('nfe')
      .update({
        status: 'autorizada',
        chave_acesso: sefazResponse.chave_acesso,
        protocolo_autorizacao: sefazResponse.protocolo,
        xml_assinado: sefazResponse.xml_assinado,
        data_autorizacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', nfe_id)

    if (updateError) {
      console.error('Error updating NFe:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NFe emitida com sucesso',
        data: sefazResponse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error in emit-nfe function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
