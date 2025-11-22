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
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { nfeData, produtos } = await req.json();

    console.log('Iniciando emissão de NFe', { nfeData, produtos });

    // Gerar chave de acesso (44 dígitos)
    const chaveAcesso = generateChaveAcesso(nfeData);
    
    // TODO: Aqui seria a integração real com a SEFAZ
    // Por enquanto, vamos apenas simular a autorização
    
    // Inserir NFe no banco
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .insert({
        org_id: nfeData.org_id,
        chave_acesso: chaveAcesso,
        serie: nfeData.serie,
        natureza_operacao: nfeData.natureza_operacao,
        tipo_operacao: nfeData.tipo_operacao,
        finalidade: nfeData.finalidade,
        destinatario_nome: nfeData.cliente_nome,
        destinatario_cpf_cnpj: nfeData.cliente_cpf_cnpj,
        destinatario_ie: nfeData.cliente_ie,
        destinatario_endereco: nfeData.cliente_endereco,
        destinatario_numero: nfeData.cliente_numero,
        destinatario_bairro: nfeData.cliente_bairro,
        destinatario_cidade: nfeData.cliente_cidade,
        destinatario_uf: nfeData.cliente_uf,
        destinatario_cep: nfeData.cliente_cep,
        valor_produtos: parseFloat(nfeData.valor_produtos),
        valor_frete: parseFloat(nfeData.valor_frete || '0'),
        valor_seguro: parseFloat(nfeData.valor_seguro || '0'),
        valor_desconto: parseFloat(nfeData.valor_desconto || '0'),
        valor_outras_despesas: parseFloat(nfeData.valor_outras_despesas || '0'),
        valor_total: parseFloat(nfeData.valor_total),
        valor_icms: parseFloat(nfeData.valor_icms),
        valor_ipi: parseFloat(nfeData.valor_ipi),
        valor_pis: parseFloat(nfeData.valor_pis),
        valor_cofins: parseFloat(nfeData.valor_cofins),
        informacoes_complementares: nfeData.informacoes_complementares,
        informacoes_fisco: nfeData.informacoes_fisco,
        status: 'autorizada', // Simulando autorização
        data_autorizacao: new Date().toISOString(),
        protocolo_autorizacao: `${Date.now()}`, // Simulando protocolo
        created_by: user.id,
      })
      .select()
      .single();

    if (nfeError) {
      console.error('Erro ao inserir NFe:', nfeError);
      throw nfeError;
    }

    console.log('NFe inserida:', nfe);

    // Inserir itens da NFe
    const itensPromises = produtos.map((produto: any) =>
      supabaseClient
        .from('nfe_items')
        .insert({
          nfe_id: nfe.id,
          produto_codigo: produto.codigo,
          produto_descricao: produto.descricao,
          ncm: produto.ncm,
          cfop: produto.cfop,
          unidade: produto.unidade,
          quantidade: parseFloat(produto.quantidade),
          valor_unitario: parseFloat(produto.valor_unitario),
          valor_total: parseFloat(produto.valor_total),
          icms_cst: produto.icms_cst,
          icms_base: parseFloat(produto.icms_base),
          icms_aliquota: parseFloat(produto.icms_aliquota),
          icms_valor: parseFloat(produto.icms_valor),
          ipi_cst: produto.ipi_cst,
          ipi_aliquota: parseFloat(produto.ipi_aliquota),
          ipi_valor: parseFloat(produto.ipi_valor),
          pis_cst: produto.pis_cst,
          pis_aliquota: parseFloat(produto.pis_aliquota),
          pis_valor: parseFloat(produto.pis_valor),
          cofins_cst: produto.cofins_cst,
          cofins_aliquota: parseFloat(produto.cofins_aliquota),
          cofins_valor: parseFloat(produto.cofins_valor),
        })
    );

    await Promise.all(itensPromises);

    console.log('Itens inseridos com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        nfe,
        chaveAcesso,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao emitir NFe:', error);
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

function generateChaveAcesso(nfeData: any): string {
  // Simplificação: gerar chave aleatória de 44 dígitos
  // Em produção, deve seguir a regra da SEFAZ
  const uf = '35'; // SP
  const aamm = new Date().toISOString().slice(2, 7).replace('-', '');
  const cnpj = '00000000000000'; // CNPJ da empresa
  const mod = '55';
  const serie = nfeData.serie.padStart(3, '0');
  const numero = '000000001'; // Número da NFe
  const tpEmis = '1';
  const codigo = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  
  const chave = uf + aamm + cnpj + mod + serie + numero + tpEmis + codigo;
  
  // Calcular dígito verificador
  const dv = calculateDV(chave);
  
  return chave + dv;
}

function calculateDV(chave: string): string {
  const pesos = [4, 3, 2, 9, 8, 7, 6, 5];
  let soma = 0;
  
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * pesos[i % 8];
  }
  
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  
  return dv.toString();
}
