import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InutilizacaoRequest {
  serie: string;
  numeroInicial: number;
  numeroFinal: number;
  justificativa: string;
  orgId: string;
}

Deno.serve(async (req) => {
  console.log('Iniciando requisição de inutilização de numeração');

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

    const { serie, numeroInicial, numeroFinal, justificativa, orgId }: InutilizacaoRequest = await req.json();

    console.log(`Inutilizando numeração da série ${serie}, números ${numeroInicial} a ${numeroFinal}`);

    // Validações
    if (!serie || !numeroInicial || !numeroFinal || !justificativa || !orgId) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }

    if (numeroInicial > numeroFinal) {
      throw new Error('Número inicial não pode ser maior que o número final');
    }

    if (numeroFinal - numeroInicial > 1000) {
      throw new Error('Não é permitido inutilizar mais de 1000 números por vez');
    }

    // Buscar configuração fiscal
    const { data: fiscalConfig, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !fiscalConfig) {
      console.error('Erro ao buscar configuração fiscal:', configError);
      throw new Error('Configuração fiscal não encontrada. Configure o emissor primeiro.');
    }

    // Verificar se algum número já foi utilizado
    const { data: nfesExistentes } = await supabaseClient
      .from('nfe')
      .select('numero')
      .eq('org_id', orgId)
      .eq('serie', serie)
      .gte('numero', numeroInicial)
      .lte('numero', numeroFinal);

    if (nfesExistentes && nfesExistentes.length > 0) {
      const numerosUsados = nfesExistentes.map(n => n.numero).join(', ');
      throw new Error(`Os seguintes números já foram utilizados: ${numerosUsados}`);
    }

    console.log('Enviando solicitação de inutilização para SEFAZ');

    // Simulação da resposta da SEFAZ
    // Em produção, aqui seria feita a chamada real para o webservice da SEFAZ
    const protocoloSefaz = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ano = new Date().getFullYear().toString().slice(-2);
    
    const inutilizacaoAutorizada = {
      status: 'autorizada',
      protocolo: protocoloSefaz,
      dataHora: new Date().toISOString(),
      mensagem: `Inutilização de número homologada`,
      serie,
      numeroInicial,
      numeroFinal,
      ano
    };

    console.log('Inutilização autorizada pela SEFAZ, registrando no banco');

    // Registrar a inutilização na tabela
    const { error: inutilizacaoError } = await supabaseClient
      .from('nfe_inutilizacao')
      .insert({
        org_id: orgId,
        serie,
        numero_inicial: numeroInicial,
        numero_final: numeroFinal,
        ano: ano,
        justificativa,
        protocolo: inutilizacaoAutorizada.protocolo,
        data_inutilizacao: inutilizacaoAutorizada.dataHora,
        status: 'autorizado',
        created_by: user.id
      });

    if (inutilizacaoError) {
      console.error('Erro ao registrar inutilização:', inutilizacaoError);
      throw new Error('Erro ao registrar inutilização no banco de dados');
    }

    console.log('Inutilização registrada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        data: inutilizacaoAutorizada
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na inutilização de numeração:', error);
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
