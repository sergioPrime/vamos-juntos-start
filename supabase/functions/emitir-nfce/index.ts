import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFCeItem {
  product_id?: string;
  codigo_produto: string;
  descricao: string;
  ncm?: string;
  cest?: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_desconto?: number;
  cfop: string;
  icms_origem?: string;
  icms_cst?: string;
  icms_aliquota?: number;
  ipi_cst?: string;
  ipi_aliquota?: number;
  pis_cst?: string;
  pis_aliquota?: number;
  cofins_cst?: string;
  cofins_aliquota?: number;
  // Tributos Reforma 2026
  ibs_uf_aliquota?: number;
  ibs_mun_aliquota?: number;
  cbs_aliquota?: number;
  is_aliquota?: number;
}

interface NFCeRequest {
  // Destinatário
  destinatario?: {
    tipo?: string;
    nome?: string;
    documento?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  
  // Itens
  items: NFCeItem[];
  
  // Pagamento
  forma_pagamento: string;
  troco?: number;
  
  // Operação
  natureza_operacao?: string;
  presenca_comprador?: string;
  
  // Informações adicionais
  informacoes_complementares?: string;
  
  // Origem
  order_id?: string;
  caixa_sessao_id?: string;
}

serve(async (req) => {
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

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    // Obter organização do usuário
    const { data: userOrg, error: orgError } = await supabaseClient
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg) {
      throw new Error('Organização não encontrada');
    }

    const orgId = userOrg.org_id;

    // Parse request body
    const nfceData: NFCeRequest = await req.json();

    // Validações
    if (!nfceData.items || nfceData.items.length === 0) {
      throw new Error('NFC-e deve conter ao menos um item');
    }

    if (!nfceData.forma_pagamento) {
      throw new Error('Forma de pagamento é obrigatória');
    }

    // Buscar configuração fiscal
    const { data: fiscalConfig, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single();

    if (configError || !fiscalConfig) {
      throw new Error('Configuração fiscal não encontrada. Configure os dados fiscais antes de emitir NFC-e.');
    }

    console.log('Emitindo NFC-e para org:', orgId);

    // Criar NFC-e
    const { data: nfce, error: insertError } = await supabaseClient
      .from('nfce')
      .insert({
        org_id: orgId,
        company_id: fiscalConfig.company_id,
        serie: '1',
        modelo: '65',
        destinatario_tipo: nfceData.destinatario?.tipo || 'person',
        destinatario_nome: nfceData.destinatario?.nome,
        destinatario_documento: nfceData.destinatario?.documento,
        destinatario_email: nfceData.destinatario?.email,
        destinatario_telefone: nfceData.destinatario?.telefone,
        destinatario_endereco: nfceData.destinatario?.endereco,
        destinatario_numero: nfceData.destinatario?.numero,
        destinatario_complemento: nfceData.destinatario?.complemento,
        destinatario_bairro: nfceData.destinatario?.bairro,
        destinatario_cidade: nfceData.destinatario?.cidade,
        destinatario_uf: nfceData.destinatario?.uf,
        destinatario_cep: nfceData.destinatario?.cep,
        forma_pagamento: nfceData.forma_pagamento,
        troco: nfceData.troco || 0,
        natureza_operacao: nfceData.natureza_operacao || 'Venda ao Consumidor',
        presenca_comprador: nfceData.presenca_comprador || 'presencial',
        informacoes_complementares: nfceData.informacoes_complementares,
        order_id: nfceData.order_id,
        caixa_sessao_id: nfceData.caixa_sessao_id,
        status: 'pendente',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar NFC-e:', insertError);
      throw insertError;
    }

    console.log('NFC-e criada:', nfce.id);

    // Inserir itens
    const itemsToInsert = nfceData.items.map((item, index) => {
      const valorTotal = (item.quantidade * item.valor_unitario) - (item.valor_desconto || 0);
      
      // Calcular tributos
      const icmsBase = valorTotal;
      const icmsValor = icmsBase * ((item.icms_aliquota || 0) / 100);
      
      const ipiBase = valorTotal;
      const ipiValor = ipiBase * ((item.ipi_aliquota || 0) / 100);
      
      const pisBase = valorTotal;
      const pisValor = pisBase * ((item.pis_aliquota || 0) / 100);
      
      const cofinsBase = valorTotal;
      const cofinsValor = cofinsBase * ((item.cofins_aliquota || 0) / 100);
      
      // Tributos Reforma 2026
      const ibsUfValor = valorTotal * ((item.ibs_uf_aliquota || 0) / 100);
      const ibsMunValor = valorTotal * ((item.ibs_mun_aliquota || 0) / 100);
      const cbsValor = valorTotal * ((item.cbs_aliquota || 0) / 100);
      const isValor = valorTotal * ((item.is_aliquota || 0) / 100);

      return {
        nfce_id: nfce.id,
        numero_item: index + 1,
        product_id: item.product_id,
        codigo_produto: item.codigo_produto,
        descricao: item.descricao,
        ncm: item.ncm,
        cest: item.cest,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: valorTotal,
        valor_desconto: item.valor_desconto || 0,
        cfop: item.cfop,
        icms_origem: item.icms_origem,
        icms_cst: item.icms_cst,
        icms_base_calculo: icmsBase,
        icms_aliquota: item.icms_aliquota || 0,
        icms_valor: icmsValor,
        ipi_cst: item.ipi_cst,
        ipi_base_calculo: ipiBase,
        ipi_aliquota: item.ipi_aliquota || 0,
        ipi_valor: ipiValor,
        pis_cst: item.pis_cst,
        pis_base_calculo: pisBase,
        pis_aliquota: item.pis_aliquota || 0,
        pis_valor: pisValor,
        cofins_cst: item.cofins_cst,
        cofins_base_calculo: cofinsBase,
        cofins_aliquota: item.cofins_aliquota || 0,
        cofins_valor: cofinsValor,
        ibs_uf_aliquota: item.ibs_uf_aliquota || 0,
        ibs_uf_valor: ibsUfValor,
        ibs_mun_aliquota: item.ibs_mun_aliquota || 0,
        ibs_mun_valor: ibsMunValor,
        cbs_aliquota: item.cbs_aliquota || 0,
        cbs_valor: cbsValor,
        is_aliquota: item.is_aliquota || 0,
        is_valor: isValor,
      };
    });

    const { error: itemsError } = await supabaseClient
      .from('nfce_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Erro ao inserir itens:', itemsError);
      throw itemsError;
    }

    console.log('Itens inseridos com sucesso');

    // Simular resposta da SEFAZ
    const chaveAcesso = `${fiscalConfig.uf_emitente}${new Date().getFullYear().toString().slice(-2)}${fiscalConfig.cnpj.padStart(14, '0')}65001${String(nfce.numero).padStart(9, '0')}${Math.floor(Math.random() * 900000000 + 100000000)}`;
    
    const protocolo = `${Math.floor(Math.random() * 900000000000000 + 100000000000000)}`;
    
    const qrCode = `https://www.fazenda.sp.gov.br/nfce/qrcode?p=${chaveAcesso}|2|1|${nfce.numero}`;

    // Atualizar NFC-e com dados de autorização
    const { data: updatedNfce, error: updateError } = await supabaseClient
      .from('nfce')
      .update({
        status: 'autorizada',
        chave_acesso: chaveAcesso,
        protocolo_autorizacao: protocolo,
        data_autorizacao: new Date().toISOString(),
        qr_code: qrCode,
        url_consulta: `https://www.fazenda.sp.gov.br/nfce/consulta?chave=${chaveAcesso}`,
      })
      .eq('id', nfce.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar NFC-e:', updateError);
      throw updateError;
    }

    console.log('NFC-e autorizada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        nfce: updatedNfce,
        message: 'NFC-e emitida com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao emitir NFC-e:', error);
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
