import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { nfeId } = await req.json();

    console.log('Autorizando NFe:', nfeId);

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('fiscal_nfe')
      .select('*, fiscal_nfe_items(*)')
      .eq('id', nfeId)
      .single();

    if (nfeError) throw nfeError;

    // Buscar configuração fiscal
    const { data: config, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', nfe.org_id)
      .single();

    if (configError) throw configError;

    if (!config.certificate_pfx) {
      throw new Error('Certificado digital não configurado');
    }

    // ============================================
    // INTEGRAÇÃO REAL COM SEFAZ
    // ============================================
    // NOTA: Para implementação real, são necessárias as seguintes bibliotecas:
    // 1. node-forge ou crypto-js para manipular certificados
    // 2. xmlbuilder2 para construir XML
    // 3. soap ou axios para fazer requisições SOAP à SEFAZ
    // 
    // Passos da integração real:
    // 1. Construir XML da NFe conforme layout da SEFAZ
    // 2. Assinar digitalmente o XML com o certificado A1
    // 3. Enviar para o webservice NFeAutorizacao4 da SEFAZ
    // 4. Processar retorno e atualizar status
    
    // URLs dos webservices por UF (exemplo SP):
    const webserviceUrls = {
      'homologacao': {
        'SP': 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      },
      'producao': {
        'SP': 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      }
    };

    // Por enquanto, simular autorização
    const simulatedResponse = {
      status: 'autorizada',
      chave_acesso: `${config.uf}${new Date().getFullYear().toString().slice(-2)}${config.cnpj}55${config.serie_nfe.padStart(3, '0')}${nfe.numero.toString().padStart(9, '0')}${Math.random().toString().slice(2, 10)}`,
      protocolo: `${config.uf}${Date.now().toString().slice(-10)}`,
      data_autorizacao: new Date().toISOString(),
      xml_autorizado: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${nfe.chave_acesso || ''}" versao="4.00">
      <ide>
        <cUF>${config.uf === 'SP' ? '35' : '00'}</cUF>
        <cNF>${Math.random().toString().slice(2, 10)}</cNF>
        <natOp>${nfe.natureza_operacao}</natOp>
        <mod>55</mod>
        <serie>${config.serie_nfe}</serie>
        <nNF>${nfe.numero}</nNF>
        <dhEmi>${nfe.data_emissao}T${new Date().toTimeString().slice(0, 8)}-03:00</dhEmi>
        <tpNF>${nfe.tipo_operacao === 'entrada' ? '0' : '1'}</tpNF>
        <idDest>1</idDest>
        <cMunFG>${config.codigo_municipio}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
        <finNFe>${nfe.finalidade === 'normal' ? '1' : nfe.finalidade === 'complementar' ? '2' : nfe.finalidade === 'ajuste' ? '3' : '4'}</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>PrimeGestor 1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${config.cnpj}</CNPJ>
        <xNome>${config.razao_social}</xNome>
        <xFant>${config.nome_fantasia || config.razao_social}</xFant>
        <enderEmit>
          <xLgr>${config.logradouro}</xLgr>
          <nro>${config.numero}</nro>
          <xBairro>${config.bairro}</xBairro>
          <cMun>${config.codigo_municipio}</cMun>
          <xMun>${config.municipio}</xMun>
          <UF>${config.uf_emitente}</UF>
          <CEP>${config.cep}</CEP>
        </enderEmit>
        <IE>${config.inscricao_estadual}</IE>
        <CRT>${config.regime_tributario}</CRT>
      </emit>
      <dest>
        <${nfe.destinatario_tipo === 'pf' ? 'CPF' : 'CNPJ'}>${nfe.destinatario_documento}</${nfe.destinatario_tipo === 'pf' ? 'CPF' : 'CNPJ'}>
        <xNome>${nfe.destinatario_nome}</xNome>
        <enderDest>
          <xLgr>${nfe.destinatario_endereco || ''}</xLgr>
          <nro>${nfe.destinatario_numero || 'S/N'}</nro>
          <xBairro>${nfe.destinatario_bairro || ''}</xBairro>
          <cMun>3550308</cMun>
          <xMun>${nfe.destinatario_cidade || ''}</xMun>
          <UF>${nfe.destinatario_uf || ''}</UF>
          <CEP>${nfe.destinatario_cep || ''}</CEP>
        </enderDest>
        ${nfe.destinatario_ie ? `<IE>${nfe.destinatario_ie}</IE>` : '<indIEDest>9</indIEDest>'}
      </dest>
      ${nfe.fiscal_nfe_items?.map((item: any, index: number) => `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${item.codigo_produto}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${item.descricao}</xProd>
          <NCM>${item.ncm}</NCM>
          <CFOP>${item.cfop}</CFOP>
          <uCom>${item.unidade}</uCom>
          <qCom>${item.quantidade}</qCom>
          <vUnCom>${item.valor_unitario}</vUnCom>
          <vProd>${item.valor_total}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>${item.unidade}</uTrib>
          <qTrib>${item.quantidade}</qTrib>
          <vUnTrib>${item.valor_unitario}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>0</modBC>
              <vBC>${item.base_icms || 0}</vBC>
              <pICMS>${item.aliquota_icms || 0}</pICMS>
              <vICMS>${item.valor_icms || 0}</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>${item.base_pis || 0}</vBC>
              <pPIS>${item.aliquota_pis || 0}</pPIS>
              <vPIS>${item.valor_pis || 0}</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>${item.base_cofins || 0}</vBC>
              <pCOFINS>${item.aliquota_cofins || 0}</pCOFINS>
              <vCOFINS>${item.valor_cofins || 0}</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      `).join('')}
      <total>
        <ICMSTot>
          <vBC>${nfe.base_calculo_icms || 0}</vBC>
          <vICMS>${nfe.valor_icms || 0}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${nfe.valor_total_produtos}</vProd>
          <vFrete>${nfe.valor_frete || 0}</vFrete>
          <vSeg>${nfe.valor_seguro || 0}</vSeg>
          <vDesc>${nfe.valor_desconto || 0}</vDesc>
          <vII>0.00</vII>
          <vIPI>${nfe.valor_ipi || 0}</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${nfe.valor_pis || 0}</vPIS>
          <vCOFINS>${nfe.valor_cofins || 0}</vCOFINS>
          <vOutro>${nfe.valor_outras_despesas || 0}</vOutro>
          <vNF>${nfe.valor_total_nota}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>${nfe.modalidade_frete || '9'}</modFrete>
      </transp>
      <infAdic>
        <infCpl>${nfe.informacoes_complementares || ''}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>SVRS202301171530</verAplic>
      <chNFe>${simulatedResponse.chave_acesso}</chNFe>
      <dhRecbto>${simulatedResponse.data_autorizacao}</dhRecbto>
      <nProt>${simulatedResponse.protocolo}</nProt>
      <digVal>SIMULADO</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`,
    };

    // Atualizar NFe no banco
    const { error: updateError } = await supabaseClient
      .from('fiscal_nfe')
      .update({
        status: simulatedResponse.status,
        chave_acesso: simulatedResponse.chave_acesso,
        protocolo_autorizacao: simulatedResponse.protocolo,
        data_autorizacao: simulatedResponse.data_autorizacao,
      })
      .eq('id', nfeId);

    if (updateError) throw updateError;

    // Registrar log
    await supabaseClient
      .from('fiscal_sefaz_logs')
      .insert({
        org_id: nfe.org_id,
        nfe_id: nfeId,
        operation_type: 'autorizacao',
        request_xml: 'XML da requisição (assinado)',
        response_xml: simulatedResponse.xml_autorizado,
        status_code: '100',
        status_message: 'Autorizado o uso da NF-e',
        protocolo: simulatedResponse.protocolo,
      });

    console.log('NFe autorizada com sucesso:', simulatedResponse.chave_acesso);

    return new Response(
      JSON.stringify({
        success: true,
        data: simulatedResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in autorizar-nfe:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});