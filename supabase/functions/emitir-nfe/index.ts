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

    const nfeData = await req.json()

    console.log('Iniciando emissão de NFe')

    // Buscar dados do perfil e organização
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('org_id')
      .single()

    if (!profile) throw new Error('Perfil não encontrado')

    // Gerar chave de acesso (44 dígitos)
    const codigoUF = nfeData.codigo_uf || '35' // SP por padrão
    const anoMes = new Date().toISOString().slice(2, 7).replace('-', '')
    const cnpj = nfeData.cnpj_emitente?.replace(/\D/g, '') || '00000000000000'
    const modelo = '55'
    const serie = String(nfeData.serie || '1').padStart(3, '0')
    const numero = String(nfeData.numero).padStart(9, '0')
    const tipoEmissao = '1'
    const codigoNumerico = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    
    // Calcular dígito verificador (simplificado)
    const chaveBase = `${codigoUF}${anoMes}${cnpj}${modelo}${serie}${numero}${tipoEmissao}${codigoNumerico}`
    const dv = calcularDV(chaveBase)
    const chaveAcesso = `${chaveBase}${dv}`

    console.log(`Chave de acesso gerada: ${chaveAcesso}`)

    // Gerar XML da NFe
    const nfeXML = gerarXMLNFe({
      ...nfeData,
      chave_acesso: chaveAcesso,
      data_emissao: new Date().toISOString()
    })

    console.log('XML da NFe gerado')

    // TODO: Assinar XML com certificado digital
    const xmlAssinado = nfeXML

    // TODO: Enviar para SEFAZ
    // Por enquanto, simula autorização automática
    const protocolo = `135${Date.now().toString().slice(-12)}`
    const status = 'autorizada'

    console.log(`NFe autorizada com protocolo ${protocolo}`)

    // Inserir NFe no banco de dados
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .insert({
        numero: nfeData.numero,
        serie: nfeData.serie,
        modelo: '55',
        tipo_operacao: nfeData.tipo_operacao || '1',
        natureza_operacao: nfeData.natureza_operacao,
        data_emissao: new Date().toISOString(),
        data_saida_entrada: nfeData.data_saida_entrada || new Date().toISOString(),
        
        // Emitente
        cnpj_emitente: nfeData.cnpj_emitente,
        razao_social_emitente: nfeData.razao_social_emitente,
        nome_fantasia_emitente: nfeData.nome_fantasia_emitente,
        endereco_emitente: nfeData.endereco_emitente,
        municipio_emitente: nfeData.municipio_emitente,
        uf_emitente: nfeData.uf_emitente,
        cep_emitente: nfeData.cep_emitente,
        
        // Destinatário
        destinatario_id: nfeData.destinatario_id,
        documento_destinatario: nfeData.documento_destinatario,
        razao_social_destinatario: nfeData.razao_social_destinatario,
        endereco_destinatario: nfeData.endereco_destinatario,
        municipio_destinatario: nfeData.municipio_destinatario,
        uf_destinatario: nfeData.uf_destinatario,
        cep_destinatario: nfeData.cep_destinatario,
        
        // Valores
        valor_produtos: nfeData.valor_produtos || 0,
        valor_frete: nfeData.valor_frete || 0,
        valor_seguro: nfeData.valor_seguro || 0,
        valor_desconto: nfeData.valor_desconto || 0,
        valor_outras_despesas: nfeData.valor_outras_despesas || 0,
        valor_total: nfeData.valor_total || 0,
        
        // Impostos
        base_calculo_icms: nfeData.base_calculo_icms || 0,
        valor_icms: nfeData.valor_icms || 0,
        base_calculo_icms_st: nfeData.base_calculo_icms_st || 0,
        valor_icms_st: nfeData.valor_icms_st || 0,
        valor_ipi: nfeData.valor_ipi || 0,
        valor_pis: nfeData.valor_pis || 0,
        valor_cofins: nfeData.valor_cofins || 0,
        
        // Reforma Tributária
        valor_ibs_total: nfeData.valor_ibs_total || 0,
        valor_cbs_total: nfeData.valor_cbs_total || 0,
        
        // Controle
        chave_acesso: chaveAcesso,
        protocolo_autorizacao: protocolo,
        data_autorizacao: new Date().toISOString(),
        status: status,
        xml_original: nfeXML,
        xml_autorizado: xmlAssinado,
        
        org_id: profile.org_id,
        codigo_uf: codigoUF
      })
      .select()
      .single()

    if (nfeError) throw nfeError

    // Inserir itens da NFe
    if (nfeData.itens && nfeData.itens.length > 0) {
      const itensToInsert = nfeData.itens.map((item: any, index: number) => ({
        nfe_id: nfe.id,
        numero_item: index + 1,
        codigo_produto: item.codigo_produto,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade: item.unidade || 'UN',
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        base_calculo_icms: item.base_calculo_icms || 0,
        aliquota_icms: item.aliquota_icms || 0,
        valor_icms: item.valor_icms || 0,
        aliquota_ipi: item.aliquota_ipi || 0,
        valor_ipi: item.valor_ipi || 0,
        aliquota_pis: item.aliquota_pis || 0,
        valor_pis: item.valor_pis || 0,
        aliquota_cofins: item.aliquota_cofins || 0,
        valor_cofins: item.valor_cofins || 0,
        org_id: profile.org_id
      }))

      const { error: itensError } = await supabaseClient
        .from('nfe_itens')
        .insert(itensToInsert)

      if (itensError) {
        console.error('Erro ao inserir itens:', itensError)
        throw itensError
      }
    }

    console.log(`NFe ${nfe.numero} emitida com sucesso`)

    return new Response(
      JSON.stringify({
        success: true,
        nfe: {
          id: nfe.id,
          numero: nfe.numero,
          serie: nfe.serie,
          chave_acesso: chaveAcesso,
          protocolo: protocolo,
          status: status,
          data_autorizacao: nfe.data_autorizacao
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao emitir NFe:', error)
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

function calcularDV(chave: string): string {
  const multiplicadores = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * multiplicadores[i]
  }
  
  const resto = soma % 11
  const dv = resto < 2 ? 0 : 11 - resto
  
  return String(dv)
}

function gerarXMLNFe(nfeData: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${nfeData.chave_acesso}" versao="4.00">
      <ide>
        <cUF>${nfeData.codigo_uf || '35'}</cUF>
        <cNF>${Math.floor(Math.random() * 100000000)}</cNF>
        <natOp>${nfeData.natureza_operacao}</natOp>
        <mod>55</mod>
        <serie>${nfeData.serie}</serie>
        <nNF>${nfeData.numero}</nNF>
        <dhEmi>${nfeData.data_emissao}</dhEmi>
        <tpNF>${nfeData.tipo_operacao || '1'}</tpNF>
        <idDest>1</idDest>
        <cMunFG>${nfeData.codigo_municipio_emitente || '3550308'}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${nfeData.chave_acesso.slice(-1)}</cDV>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${nfeData.cnpj_emitente?.replace(/\D/g, '')}</CNPJ>
        <xNome>${nfeData.razao_social_emitente}</xNome>
        <xFant>${nfeData.nome_fantasia_emitente || nfeData.razao_social_emitente}</xFant>
        <enderEmit>
          <xLgr>${nfeData.endereco_emitente}</xLgr>
          <xMun>${nfeData.municipio_emitente}</xMun>
          <UF>${nfeData.uf_emitente}</UF>
          <CEP>${nfeData.cep_emitente?.replace(/\D/g, '')}</CEP>
        </enderEmit>
        <IE>${nfeData.ie_emitente || ''}</IE>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CNPJ>${nfeData.documento_destinatario?.replace(/\D/g, '')}</CNPJ>
        <xNome>${nfeData.razao_social_destinatario}</xNome>
        <enderDest>
          <xLgr>${nfeData.endereco_destinatario}</xLgr>
          <xMun>${nfeData.municipio_destinatario}</xMun>
          <UF>${nfeData.uf_destinatario}</UF>
          <CEP>${nfeData.cep_destinatario?.replace(/\D/g, '')}</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <total>
        <ICMSTot>
          <vBC>${nfeData.base_calculo_icms || 0}</vBC>
          <vICMS>${nfeData.valor_icms || 0}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>${nfeData.base_calculo_icms_st || 0}</vBCST>
          <vST>${nfeData.valor_icms_st || 0}</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${nfeData.valor_produtos || 0}</vProd>
          <vFrete>${nfeData.valor_frete || 0}</vFrete>
          <vSeg>${nfeData.valor_seguro || 0}</vSeg>
          <vDesc>${nfeData.valor_desconto || 0}</vDesc>
          <vII>0.00</vII>
          <vIPI>${nfeData.valor_ipi || 0}</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${nfeData.valor_pis || 0}</vPIS>
          <vCOFINS>${nfeData.valor_cofins || 0}</vCOFINS>
          <vOutro>${nfeData.valor_outras_despesas || 0}</vOutro>
          <vNF>${nfeData.valor_total || 0}</vNF>
        </ICMSTot>
      </total>
      <infAdic>
        <infCpl>${nfeData.informacoes_complementares || ''}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`
}
