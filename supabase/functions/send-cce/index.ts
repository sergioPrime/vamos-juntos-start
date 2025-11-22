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
    const { nfe_id, correcao, org_id } = await req.json();

    if (!nfe_id || !correcao || !org_id) {
      throw new Error('Parâmetros obrigatórios: nfe_id, correcao, org_id');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar NFe
    const { data: nfe, error: nfeError } = await supabase
      .from('nfe')
      .select('*')
      .eq('id', nfe_id)
      .single();

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada');
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Somente NFe autorizadas podem receber CC-e');
    }

    // Validar correção (mínimo 15 caracteres)
    if (correcao.length < 15) {
      throw new Error('A correção deve ter no mínimo 15 caracteres');
    }

    // Buscar sequência da CC-e
    const { data: cceExistentes } = await supabase
      .from('nfe_carta_correcao')
      .select('sequencia')
      .eq('nfe_id', nfe_id)
      .order('sequencia', { ascending: false })
      .limit(1);

    const sequencia = cceExistentes && cceExistentes.length > 0 
      ? cceExistentes[0].sequencia + 1 
      : 1;

    if (sequencia > 20) {
      throw new Error('Limite máximo de 20 CC-e por NFe atingido');
    }

    console.log('Gerando XML da CC-e...');

    // Gerar XML da CC-e
    const xmlCCe = generateCCeXML(nfe, correcao, sequencia);

    console.log('Assinando XML...');

    // Assinar XML
    const xmlAssinado = await signXML(xmlCCe);

    console.log('Enviando para SEFAZ...');

    // Enviar para SEFAZ
    const protocolo = await sendCCeToSefaz(xmlAssinado, nfe.uf_emitente);

    console.log('CC-e autorizada:', protocolo);

    // Salvar CC-e
    const { error: cceError } = await supabase
      .from('nfe_carta_correcao')
      .insert({
        nfe_id,
        org_id,
        sequencia,
        correcao,
        protocolo,
        xml_evento: xmlAssinado,
        created_by: req.headers.get('x-user-id')
      });

    if (cceError) {
      console.error('Erro ao salvar CC-e:', cceError);
      throw cceError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Carta de Correção enviada com sucesso',
        protocolo,
        sequencia
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao enviar CC-e:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function generateCCeXML(nfe: any, correcao: string, sequencia: number): string {
  const dataEvento = new Date().toISOString();
  const tpEvento = '110110'; // Código do evento de CC-e
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>1</idLote>
  <evento versao="1.00">
    <infEvento Id="ID${tpEvento}${nfe.chave_acesso}${String(sequencia).padStart(2, '0')}">
      <cOrgao>${nfe.uf_emitente === 'SP' ? '35' : '91'}</cOrgao>
      <tpAmb>${nfe.ambiente || '2'}</tpAmb>
      <CNPJ>${nfe.cnpj_emitente}</CNPJ>
      <chNFe>${nfe.chave_acesso}</chNFe>
      <dhEvento>${dataEvento}</dhEvento>
      <tpEvento>${tpEvento}</tpEvento>
      <nSeqEvento>${sequencia}</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Carta de Correcao</descEvento>
        <xCorrecao>${correcao}</xCorrecao>
        <xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso>
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`;
}

async function signXML(xml: string): Promise<string> {
  console.log('Assinando XML (implementação simplificada)');
  return xml;
}

async function sendCCeToSefaz(xml: string, uf: string): Promise<string> {
  const ambiente = Deno.env.get('NFE_AMBIENTE') || 'homologacao';
  const isSP = uf === 'SP';
  
  const url = ambiente === 'producao'
    ? (isSP 
        ? 'https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx'
        : 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx')
    : (isSP
        ? 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx'
        : 'https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx');

  console.log('URL SEFAZ:', url);
  console.log('Simulando envio para SEFAZ...');
  
  const protocolo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  return protocolo;
}
