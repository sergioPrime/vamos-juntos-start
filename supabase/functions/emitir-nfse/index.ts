import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmitirNFSeRequest {
  tomador: {
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  servico: {
    codigoServico: string;
    discriminacao: string;
    codigoTributacaoMunicipio?: string;
  };
  valores: {
    valorServicos: number;
    valorDeducoes?: number;
    aliquotaIss?: number;
  };
  retencoes: {
    issRetido?: boolean;
    pisRetido?: boolean;
    cofinsRetido?: boolean;
    inssRetido?: boolean;
    irRetido?: boolean;
    csllRetido?: boolean;
  };
  dataCompetencia: string;
}

Deno.serve(async (req) => {
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
      throw new Error('Não autenticado');
    }

    const body: EmitirNFSeRequest = await req.json();
    const { tomador, servico, valores, retencoes, dataCompetencia } = body;

    console.log('Iniciando emissão de NFS-e:', { tomador: tomador.nome });

    // Buscar organização do usuário
    const { data: userOrgs, error: orgError } = await supabaseClient
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orgError || !userOrgs) {
      throw new Error('Organização não encontrada');
    }

    const orgId = userOrgs.org_id;

    // Calcular valores
    const aliquota = valores.aliquotaIss || 5.0;
    const valorDeducoes = valores.valorDeducoes || 0;
    const baseCalculo = valores.valorServicos - valorDeducoes;
    const valorIss = baseCalculo * (aliquota / 100);
    
    // Valores de retenções (simplificado - 5% para cada tributo retido)
    const valorPis = retencoes.pisRetido ? baseCalculo * 0.0165 : 0;
    const valorCofins = retencoes.cofinsRetido ? baseCalculo * 0.076 : 0;
    const valorInss = retencoes.inssRetido ? baseCalculo * 0.11 : 0;
    const valorIr = retencoes.irRetido ? baseCalculo * 0.015 : 0;
    const valorCsll = retencoes.csllRetido ? baseCalculo * 0.01 : 0;
    
    const valorLiquido = valores.valorServicos - valorDeducoes - 
      (retencoes.issRetido ? valorIss : 0) - valorPis - valorCofins - valorInss - valorIr - valorCsll;

    // Criar registro de NFS-e
    const { data: nfse, error: insertError } = await supabaseClient
      .from('nfse')
      .insert({
        org_id: orgId,
        serie: '1',
        tomador_nome: tomador.nome,
        tomador_cpf_cnpj: tomador.cpfCnpj,
        tomador_email: tomador.email,
        tomador_telefone: tomador.telefone,
        tomador_endereco: tomador.endereco,
        tomador_numero: tomador.numero,
        tomador_bairro: tomador.bairro,
        tomador_cidade: tomador.cidade,
        tomador_uf: tomador.uf,
        tomador_cep: tomador.cep,
        codigo_servico: servico.codigoServico,
        discriminacao: servico.discriminacao,
        codigo_tributacao_municipio: servico.codigoTributacaoMunicipio,
        valor_servicos: valores.valorServicos,
        valor_deducoes: valorDeducoes,
        valor_pis: valorPis,
        valor_cofins: valorCofins,
        valor_inss: valorInss,
        valor_ir: valorIr,
        valor_csll: valorCsll,
        valor_iss: valorIss,
        valor_iss_retido: retencoes.issRetido ? valorIss : 0,
        aliquota_iss: aliquota,
        valor_liquido: valorLiquido,
        iss_retido: retencoes.issRetido || false,
        pis_retido: retencoes.pisRetido || false,
        cofins_retido: retencoes.cofinsRetido || false,
        inss_retido: retencoes.inssRetido || false,
        ir_retido: retencoes.irRetido || false,
        csll_retido: retencoes.csllRetido || false,
        data_competencia: dataCompetencia,
        status: 'processando',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar NFS-e:', insertError);
      throw new Error('Erro ao criar registro de NFS-e');
    }

    console.log('NFS-e criada:', nfse.id);

    // SIMULAÇÃO: Comunicação com prefeitura
    // Em produção, aqui seria feita a integração real com a prefeitura
    const simulatedProtocol = `NFSE${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const codigoVerificacao = `${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const simulatedResponse = {
      status: 'autorizada',
      protocolo: simulatedProtocol,
      numero: nfse.numero,
      codigoVerificacao,
      linkVisualizacao: `https://nfse.prefeitura.gov.br/consulta?codigo=${codigoVerificacao}`,
      mensagem: 'NFS-e emitida com sucesso',
    };

    console.log('Simulando resposta da prefeitura:', simulatedResponse);

    // Gerar XML simplificado (em produção seria o XML completo)
    const xmlNfse = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe>
  <Numero>${nfse.numero}</Numero>
  <CodigoVerificacao>${codigoVerificacao}</CodigoVerificacao>
  <DataEmissao>${new Date().toISOString()}</DataEmissao>
  <Tomador>
    <Nome>${tomador.nome}</Nome>
    <CpfCnpj>${tomador.cpfCnpj}</CpfCnpj>
  </Tomador>
  <Servico>
    <Discriminacao>${servico.discriminacao}</Discriminacao>
    <ValorServicos>${valores.valorServicos}</ValorServicos>
    <ValorISS>${valorIss}</ValorISS>
    <ValorLiquido>${valorLiquido}</ValorLiquido>
  </Servico>
</NFSe>`;

    // Atualizar registro com resultado
    const { error: updateError } = await supabaseClient
      .from('nfse')
      .update({
        status: simulatedResponse.status,
        protocolo: simulatedResponse.protocolo,
        codigo_verificacao: codigoVerificacao,
        link_visualizacao: simulatedResponse.linkVisualizacao,
        xml_nfse: xmlNfse,
        mensagem_retorno: simulatedResponse.mensagem,
      })
      .eq('id', nfse.id);

    if (updateError) {
      console.error('Erro ao atualizar NFS-e:', updateError);
    }

    console.log('NFS-e emitida com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        nfse: {
          ...nfse,
          ...simulatedResponse,
          xml_nfse: xmlNfse,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erro na emissão da NFS-e:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar emissão de NFS-e',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
