import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NFeData {
  serie: string;
  natureza_operacao: string;
  tipo_operacao: number;
  finalidade: number;
  destinatario_nome: string;
  destinatario_cpf_cnpj: string;
  destinatario_endereco: string;
  destinatario_numero: string;
  destinatario_bairro: string;
  destinatario_cidade: string;
  destinatario_uf: string;
  destinatario_cep: string;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_total: number;
  informacoes_complementares?: string;
}

interface NFeItem {
  item_numero: number;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade_comercial: string;
  quantidade_comercial: number;
  valor_unitario: number;
  valor_total: number;
  icms_origem: string;
  icms_cst: string;
  icms_base_calculo: number;
  icms_aliquota: number;
  icms_valor: number;
}

// Função para gerar chave de acesso da NFe
function generateChaveAcesso(
  uf: string,
  emissao: Date,
  cnpj: string,
  serie: string,
  numero: number
): string {
  // Formato simplificado: UF + AAMM + CNPJ + Modelo + Serie + Numero + Tipo + Codigo + DV
  const aamm = emissao.toISOString().substring(2, 7).replace('-', '');
  const modelo = '55'; // NFe modelo 55
  const tipo = '1'; // 1=Saída
  const codigo = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  
  // Limpar CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, '').padStart(14, '0');
  
  // Montar chave sem DV
  const chaveSemDV = [
    uf.substring(0, 2),
    aamm,
    cnpjLimpo,
    modelo,
    serie.padStart(3, '0'),
    numero.toString().padStart(9, '0'),
    tipo,
    codigo
  ].join('');
  
  // Calcular DV (simplificado - em produção use o algoritmo correto)
  const dv = calculateDV(chaveSemDV);
  
  return chaveSemDV + dv;
}

function calculateDV(chave: string): string {
  const multiplicadores = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * multiplicadores[i % multiplicadores.length];
  }
  
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  
  return dv.toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { org_id, nfe_data, items } = await req.json() as {
      org_id: string;
      nfe_data: NFeData;
      items: NFeItem[];
    };

    console.log('Emitindo NFe para org:', org_id);

    // Gerar chave de acesso
    const now = new Date();
    const chaveAcesso = generateChaveAcesso(
      nfe_data.destinatario_uf,
      now,
      '00000000000000', // Em produção, buscar CNPJ da empresa
      nfe_data.serie,
      1 // Número será gerado pelo trigger
    );

    console.log('Chave de acesso gerada:', chaveAcesso);

    // Aqui seria a integração com SEFAZ
    // Por enquanto, apenas simulamos a aprovação
    const protocoloAutorizacao = `${Date.now()}`;

    // Inserir NFe no banco
    const { data: nfeInserted, error: nfeError } = await supabase
      .from('nfe')
      .insert({
        organization_id: org_id,
        numero: 0, // Será gerado pelo trigger
        serie: nfe_data.serie,
        natureza_operacao: nfe_data.natureza_operacao,
        tipo_operacao: nfe_data.tipo_operacao,
        finalidade: nfe_data.finalidade,
        destinatario_nome: nfe_data.destinatario_nome,
        destinatario_cpf_cnpj: nfe_data.destinatario_cpf_cnpj,
        destinatario_endereco: nfe_data.destinatario_endereco,
        destinatario_numero: nfe_data.destinatario_numero,
        destinatario_bairro: nfe_data.destinatario_bairro,
        destinatario_cidade: nfe_data.destinatario_cidade,
        destinatario_uf: nfe_data.destinatario_uf,
        destinatario_cep: nfe_data.destinatario_cep,
        valor_produtos: nfe_data.valor_produtos,
        valor_frete: nfe_data.valor_frete,
        valor_seguro: nfe_data.valor_seguro,
        valor_desconto: nfe_data.valor_desconto,
        valor_total: nfe_data.valor_total,
        informacoes_complementares: nfe_data.informacoes_complementares,
        chave_acesso: chaveAcesso,
        protocolo_autorizacao: protocoloAutorizacao,
        data_autorizacao: now.toISOString(),
        status: 'autorizada',
      })
      .select()
      .single();

    if (nfeError) {
      console.error('Erro ao inserir NFe:', nfeError);
      throw nfeError;
    }

    console.log('NFe inserida:', nfeInserted.id);

    // Inserir itens da NFe
    const itemsToInsert = items.map(item => ({
      nfe_id: nfeInserted.id,
      organization_id: org_id,
      item_numero: item.item_numero,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      unidade_comercial: item.unidade_comercial,
      quantidade_comercial: item.quantidade_comercial,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
      icms_origem: item.icms_origem,
      icms_cst: item.icms_cst,
      icms_base_calculo: item.icms_base_calculo,
      icms_aliquota: item.icms_aliquota,
      icms_valor: item.icms_valor,
    }));

    const { error: itemsError } = await supabase
      .from('nfe_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Erro ao inserir itens da NFe:', itemsError);
      throw itemsError;
    }

    console.log('Itens inseridos com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        nfe_id: nfeInserted.id,
        numero: nfeInserted.numero,
        chave_acesso: chaveAcesso,
        protocolo: protocoloAutorizacao,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao emitir NFe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
