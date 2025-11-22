import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InutilizacaoRequest {
  fiscalConfigId: string;
  serie: string;
  numeroInicial: number;
  numeroFinal: number;
  justificativa: string;
  ano: number;
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

    const body: InutilizacaoRequest = await req.json();
    const { fiscalConfigId, serie, numeroInicial, numeroFinal, justificativa, ano } = body;

    console.log('Iniciando inutilização de numeração:', { fiscalConfigId, serie, numeroInicial, numeroFinal, ano });

    // Validações
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }

    if (numeroInicial > numeroFinal) {
      throw new Error('Número inicial não pode ser maior que o número final');
    }

    if (numeroFinal - numeroInicial > 999) {
      throw new Error('Não é possível inutilizar mais de 1000 números de uma vez');
    }

    // Buscar configuração fiscal
    const { data: fiscalConfig, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('id', fiscalConfigId)
      .single();

    if (configError || !fiscalConfig) {
      throw new Error('Configuração fiscal não encontrada');
    }

    // Verificar se já existe inutilização para essa faixa
    const { data: existingInutilizations, error: checkError } = await supabaseClient
      .from('nfe_inutilizacoes')
      .select('*')
      .eq('fiscal_config_id', fiscalConfigId)
      .eq('serie', serie)
      .eq('ano', ano)
      .or(`and(numero_inicial.lte.${numeroInicial},numero_final.gte.${numeroInicial}),and(numero_inicial.lte.${numeroFinal},numero_final.gte.${numeroFinal})`);

    if (checkError) {
      console.error('Erro ao verificar inutilizações existentes:', checkError);
    }

    if (existingInutilizations && existingInutilizations.length > 0) {
      throw new Error('Já existe uma inutilização para essa faixa de numeração');
    }

    // Verificar se não existem NFes nessa faixa
    const { data: existingNFes, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('numero')
      .eq('org_id', fiscalConfig.org_id)
      .eq('serie', serie)
      .gte('numero', numeroInicial)
      .lte('numero', numeroFinal);

    if (nfeError) {
      console.error('Erro ao verificar NFes existentes:', nfeError);
    }

    if (existingNFes && existingNFes.length > 0) {
      throw new Error(`Existem NFes emitidas nesta faixa (números: ${existingNFes.map(n => n.numero).join(', ')})`);
    }

    // Gerar chave de inutilização (simplificado - em produção seria gerado conforme padrão da SEFAZ)
    const chaveInutilizacao = `${fiscalConfig.uf_emitente}${ano.toString().slice(-2)}${fiscalConfig.cnpj.padStart(14, '0')}55${serie.padStart(3, '0')}${numeroInicial.toString().padStart(9, '0')}${numeroFinal.toString().padStart(9, '0')}`;

    // Criar registro de inutilização
    const { data: inutilization, error: insertError } = await supabaseClient
      .from('nfe_inutilizacoes')
      .insert({
        org_id: fiscalConfig.org_id,
        fiscal_config_id: fiscalConfigId,
        serie,
        numero_inicial: numeroInicial,
        numero_final: numeroFinal,
        justificativa,
        ano,
        modelo: '55',
        chave_inutilizacao: chaveInutilizacao,
        status: 'processando',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar inutilização:', insertError);
      throw new Error('Erro ao criar registro de inutilização');
    }

    console.log('Inutilização criada:', inutilization.id);

    // SIMULAÇÃO: Em produção, aqui seria feita a comunicação com a SEFAZ
    // Por enquanto, vamos simular uma resposta positiva
    const simulatedProtocol = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const simulatedResponse = {
      status: 'inutilizado',
      protocolo: simulatedProtocol,
      mensagem: 'Inutilização de número homologada',
      dataInutilizacao: new Date().toISOString(),
    };

    console.log('Simulando resposta da SEFAZ:', simulatedResponse);

    // Atualizar registro com resultado
    const { error: updateError } = await supabaseClient
      .from('nfe_inutilizacoes')
      .update({
        status: simulatedResponse.status,
        protocolo: simulatedResponse.protocolo,
        mensagem_sefaz: simulatedResponse.mensagem,
        data_inutilizacao: simulatedResponse.dataInutilizacao,
      })
      .eq('id', inutilization.id);

    if (updateError) {
      console.error('Erro ao atualizar inutilização:', updateError);
    }

    console.log('Inutilização concluída com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        inutilization: {
          ...inutilization,
          ...simulatedResponse,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erro na inutilização:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar inutilização',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
