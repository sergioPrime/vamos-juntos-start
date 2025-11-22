import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManifestacaoRequest {
  nfeId: string;
  tipoEvento: 'ciencia' | 'confirmacao' | 'desconhecimento' | 'nao_realizada';
  justificativa?: string;
}

Deno.serve(async (req) => {
  console.log('Iniciando requisição de manifestação do destinatário');

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

    const { nfeId, tipoEvento, justificativa }: ManifestacaoRequest = await req.json();

    console.log(`Registrando manifestação tipo ${tipoEvento} para NFe ${nfeId}`);

    if (!nfeId || !tipoEvento) {
      throw new Error('NFe ID e tipo de evento são obrigatórios');
    }

    // Validar justificativa para desconhecimento e operação não realizada
    if ((tipoEvento === 'desconhecimento' || tipoEvento === 'nao_realizada') && (!justificativa || justificativa.length < 15)) {
      throw new Error('Justificativa obrigatória (mínimo 15 caracteres) para este tipo de manifestação');
    }

    // Buscar NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*, fiscal_config!inner(*)')
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      console.error('Erro ao buscar NFe:', nfeError);
      throw new Error('NFe não encontrada');
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFes autorizadas podem ter manifestação do destinatário');
    }

    console.log('NFe encontrada, consultando último evento de manifestação');

    // Buscar último número de sequência de manifestação
    const { data: ultimoEvento } = await supabaseClient
      .from('nfe_eventos')
      .select('numero_sequencia')
      .eq('nfe_id', nfeId)
      .in('tipo_evento', ['ciencia', 'confirmacao', 'desconhecimento', 'nao_realizada'])
      .order('numero_sequencia', { ascending: false })
      .limit(1)
      .single();

    const numeroSequencia = (ultimoEvento?.numero_sequencia || 0) + 1;

    // Mapear tipo de evento para código SEFAZ
    const codigosEvento: Record<string, string> = {
      ciencia: '210210',
      confirmacao: '210200',
      desconhecimento: '210220',
      nao_realizada: '210240'
    };

    const codigoEvento = codigosEvento[tipoEvento];

    console.log(`Enviando manifestação para SEFAZ - Código: ${codigoEvento}, Sequência: ${numeroSequencia}`);

    // Simulação da resposta da SEFAZ
    // Em produção, aqui seria feita a chamada real para o webservice da SEFAZ
    const protocoloSefaz = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const manifestacaoAutorizada = {
      status: 'autorizada',
      protocolo: protocoloSefaz,
      dataHora: new Date().toISOString(),
      mensagem: `Evento registrado com sucesso`,
      codigoEvento,
      numeroSequencia
    };

    console.log('Manifestação autorizada pela SEFAZ, registrando evento no banco');

    // Registrar evento na tabela
    const { error: eventoError } = await supabaseClient
      .from('nfe_eventos')
      .insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        tipo_evento: tipoEvento,
        numero_sequencia: numeroSequencia,
        protocolo: manifestacaoAutorizada.protocolo,
        data_evento: manifestacaoAutorizada.dataHora,
        justificativa: justificativa || null,
        status: 'autorizado',
        created_by: user.id
      });

    if (eventoError) {
      console.error('Erro ao registrar evento:', eventoError);
      throw new Error('Erro ao registrar evento de manifestação');
    }

    console.log('Manifestação registrada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        data: manifestacaoAutorizada
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na manifestação do destinatário:', error);
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
