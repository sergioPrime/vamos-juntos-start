import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GerarArquivosRequest {
  nfeId: string;
  tipo: 'xml' | 'danfe' | 'both';
}

Deno.serve(async (req) => {
  console.log('Iniciando geração de arquivos XML/DANFE');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { nfeId, tipo }: GerarArquivosRequest = await req.json();

    console.log(`Gerando ${tipo} para NFe ${nfeId}`);

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select(`
        *,
        fiscal_config!inner(*),
        nfe_items(*)
      `)
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      console.error('Erro ao buscar NFe:', nfeError);
      throw new Error('NFe não encontrada');
    }

    const orgId = nfe.org_id;
    const response: any = {
      success: true,
      files: {}
    };

    // Gerar XML
    if (tipo === 'xml' || tipo === 'both') {
      console.log('Gerando arquivo XML');
      
      const xmlContent = gerarXML(nfe);
      const xmlFileName = `${orgId}/xml/${nfe.chave_acesso}.xml`;

      // Upload do XML para o storage
      const { error: uploadError } = await supabaseClient.storage
        .from('nfe-files')
        .upload(xmlFileName, xmlContent, {
          contentType: 'application/xml',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload do XML:', uploadError);
        throw new Error('Erro ao salvar arquivo XML');
      }

      // Atualizar path no banco
      await supabaseClient
        .from('nfe')
        .update({ xml_path: xmlFileName })
        .eq('id', nfeId);

      // Gerar URL pública temporária (válida por 1 hora)
      const { data: urlData } = await supabaseClient.storage
        .from('nfe-files')
        .createSignedUrl(xmlFileName, 3600);

      response.files.xml = {
        path: xmlFileName,
        url: urlData?.signedUrl
      };

      console.log('XML gerado com sucesso');
    }

    // Gerar DANFE (PDF)
    if (tipo === 'danfe' || tipo === 'both') {
      console.log('Gerando DANFE (PDF)');
      
      const danfeContent = gerarDANFE(nfe);
      const danfeFileName = `${orgId}/danfe/${nfe.chave_acesso}.pdf`;

      // Upload do DANFE para o storage
      const { error: uploadError } = await supabaseClient.storage
        .from('nfe-files')
        .upload(danfeFileName, danfeContent, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload do DANFE:', uploadError);
        throw new Error('Erro ao salvar arquivo DANFE');
      }

      // Atualizar path no banco
      await supabaseClient
        .from('nfe')
        .update({ danfe_path: danfeFileName })
        .eq('id', nfeId);

      // Gerar URL pública temporária (válida por 1 hora)
      const { data: urlData } = await supabaseClient.storage
        .from('nfe-files')
        .createSignedUrl(danfeFileName, 3600);

      response.files.danfe = {
        path: danfeFileName,
        url: urlData?.signedUrl
      };

      console.log('DANFE gerado com sucesso');
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao gerar arquivos:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Função para gerar conteúdo XML da NFe
function gerarXML(nfe: any): string {
  // Simulação de geração de XML
  // Em produção, aqui seria usada uma biblioteca específica para gerar XML conforme layout da SEFAZ
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${nfe.chave_acesso}" versao="4.00">
      <ide>
        <cUF>${nfe.fiscal_config.uf_emitente === 'SP' ? '35' : '00'}</cUF>
        <cNF>${nfe.numero.toString().padStart(8, '0')}</cNF>
        <natOp>${nfe.natureza_operacao}</natOp>
        <mod>55</mod>
        <serie>${nfe.serie}</serie>
        <nNF>${nfe.numero}</nNF>
        <dhEmi>${nfe.data_emissao}T${nfe.hora_emissao || '00:00:00'}</dhEmi>
        <tpNF>${nfe.tipo_operacao === 'saida' ? '1' : '0'}</tpNF>
        <idDest>1</idDest>
        <cMunFG>${nfe.fiscal_config.codigo_municipio}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${nfe.fiscal_config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
        <finNFe>${nfe.finalidade === 'normal' ? '1' : '2'}</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0.0</verProc>
      </ide>
      <emit>
        <CNPJ>${nfe.fiscal_config.cnpj}</CNPJ>
        <xNome>${nfe.fiscal_config.razao_social}</xNome>
        <xFant>${nfe.fiscal_config.nome_fantasia || nfe.fiscal_config.razao_social}</xFant>
        <enderEmit>
          <xLgr>${nfe.fiscal_config.logradouro}</xLgr>
          <nro>${nfe.fiscal_config.numero}</nro>
          <xBairro>${nfe.fiscal_config.bairro}</xBairro>
          <cMun>${nfe.fiscal_config.codigo_municipio}</cMun>
          <xMun>${nfe.fiscal_config.municipio}</xMun>
          <UF>${nfe.fiscal_config.uf}</UF>
          <CEP>${nfe.fiscal_config.cep}</CEP>
        </enderEmit>
        <IE>${nfe.fiscal_config.inscricao_estadual}</IE>
        <CRT>${nfe.fiscal_config.regime_tributario}</CRT>
      </emit>
      <dest>
        <CNPJ>${nfe.destinatario_documento}</CNPJ>
        <xNome>${nfe.destinatario_nome}</xNome>
        <enderDest>
          <xLgr>${nfe.destinatario_endereco || ''}</xLgr>
          <nro>${nfe.destinatario_numero || 'S/N'}</nro>
          <xBairro>${nfe.destinatario_bairro || ''}</xBairro>
          <cMun>0000000</cMun>
          <xMun>${nfe.destinatario_cidade || ''}</xMun>
          <UF>${nfe.destinatario_uf || ''}</UF>
          <CEP>${nfe.destinatario_cep || ''}</CEP>
        </enderDest>
        ${nfe.destinatario_ie ? `<IE>${nfe.destinatario_ie}</IE>` : ''}
        <email>${nfe.destinatario_email || ''}</email>
      </dest>
      <det nItem="1">
        <!-- Itens da nota seriam inseridos aqui -->
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${nfe.valor_produtos || 0}</vProd>
          <vFrete>${nfe.valor_frete || 0}</vFrete>
          <vSeg>${nfe.valor_seguro || 0}</vSeg>
          <vDesc>${nfe.valor_desconto || 0}</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>${nfe.valor_outras_despesas || 0}</vOutro>
          <vNF>${nfe.valor_total || 0}</vNF>
        </ICMSTot>
      </total>
      <infAdic>
        <infCpl>${nfe.informacoes_complementares || ''}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${nfe.fiscal_config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <verAplic>SEFAZ-SP</verAplic>
      <chNFe>${nfe.chave_acesso}</chNFe>
      <dhRecbto>${nfe.data_autorizacao || new Date().toISOString()}</dhRecbto>
      <nProt>${nfe.protocolo_autorizacao || '000000000000000'}</nProt>
      <digVal>DIGEST_VALUE_PLACEHOLDER</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  return xml;
}

// Função para gerar DANFE (PDF)
function gerarDANFE(nfe: any): Uint8Array {
  // Simulação de geração de PDF
  // Em produção, aqui seria usada uma biblioteca como PDFKit ou similar
  
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 595 842]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(DANFE - Documento Auxiliar da Nota Fiscal Eletronica) Tj
0 -20 Td
(NFe: ${nfe.numero}) Tj
0 -20 Td
(Serie: ${nfe.serie}) Tj
0 -20 Td
(Chave: ${nfe.chave_acesso}) Tj
0 -20 Td
(Emitente: ${nfe.fiscal_config?.razao_social || 'N/A'}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
592
%%EOF`;

  return new TextEncoder().encode(pdfContent);
}
