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
    const { nfe_id, motivo, org_id } = await req.json();

    if (!nfe_id || !motivo || !org_id) {
      throw new Error('Parâmetros obrigatórios: nfe_id, motivo, org_id');
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
      throw new Error('Somente NFe autorizadas podem ser canceladas');
    }

    if (!nfe.chave_acesso) {
      throw new Error('NFe sem chave de acesso');
    }

    // Validar motivo (mínimo 15 caracteres)
    if (motivo.length < 15) {
      throw new Error('O motivo deve ter no mínimo 15 caracteres');
    }

    console.log('Gerando XML de cancelamento...');

    // Gerar XML de cancelamento
    const xmlCancelamento = generateCancelamentoXML(nfe, motivo, org_id);

    console.log('Assinando XML...');

    // Assinar XML (simplificado - em produção usar certificado digital real)
    const xmlAssinado = await signXML(xmlCancelamento);

    console.log('Enviando para SEFAZ...');

    // Enviar para SEFAZ
    const protocoloCancelamento = await sendCancelamentoToSefaz(xmlAssinado, nfe.uf_emitente);

    console.log('Cancelamento autorizado:', protocoloCancelamento);

    // Salvar cancelamento
    const { error: cancelError } = await supabase
      .from('nfe_cancelamentos')
      .insert({
        nfe_id,
        org_id,
        motivo,
        protocolo_cancelamento: protocoloCancelamento,
        xml_cancelamento: xmlAssinado,
        usuario_cancelamento: req.headers.get('x-user-id')
      });

    if (cancelError) {
      console.error('Erro ao salvar cancelamento:', cancelError);
      throw cancelError;
    }

    // Atualizar status da NFe
    const { error: updateError } = await supabase
      .from('nfe')
      .update({ 
        status: 'cancelada',
        updated_at: new Date().toISOString()
      })
      .eq('id', nfe_id);

    if (updateError) {
      console.error('Erro ao atualizar NFe:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NFe cancelada com sucesso',
        protocolo: protocoloCancelamento
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao cancelar NFe:', error);
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

function generateCancelamentoXML(nfe: any, motivo: string, orgId: string): string {
  const dataEvento = new Date().toISOString();
  const tpEvento = '110111'; // Código do evento de cancelamento
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>1</idLote>
  <evento versao="1.00">
    <infEvento Id="ID${tpEvento}${nfe.chave_acesso}01">
      <cOrgao>${nfe.uf_emitente === 'SP' ? '35' : '91'}</cOrgao>
      <tpAmb>${nfe.ambiente || '2'}</tpAmb>
      <CNPJ>${nfe.cnpj_emitente}</CNPJ>
      <chNFe>${nfe.chave_acesso}</chNFe>
      <dhEvento>${dataEvento}</dhEvento>
      <tpEvento>${tpEvento}</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>${nfe.protocolo_autorizacao}</nProt>
        <xJust>${motivo}</xJust>
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`;
}

async function signXML(xml: string): Promise<string> {
  // Implementação simplificada
  // Em produção, usar certificado digital A1 com crypto API
  console.log('Assinando XML (implementação simplificada)');
  return xml;
}

async function sendCancelamentoToSefaz(xml: string, uf: string): Promise<string> {
  // Implementação simplificada
  // Em produção, fazer requisição SOAP real para webservice da SEFAZ
  
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
  
  // Simular protocolo de cancelamento
  const protocolo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  return protocolo;
}
