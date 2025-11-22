import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      throw new Error('Não autenticado');
    }

    const { nfeId, correcao, numeroSequencial } = await req.json();

    if (!nfeId || !correcao) {
      throw new Error('NFe ID e correção são obrigatórios');
    }

    if (correcao.length < 15) {
      throw new Error('A correção deve ter no mínimo 15 caracteres');
    }

    console.log('Processando Carta de Correção para NFe:', nfeId);

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select(`
        *,
        fiscal_config!inner(*)
      `)
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada');
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFes autorizadas podem ter Carta de Correção');
    }

    // Verificar número sequencial (cada CC-e deve ter número único crescente)
    const { data: eventosAnteriores } = await supabaseClient
      .from('nfe_eventos')
      .select('numero_sequencial')
      .eq('nfe_id', nfeId)
      .eq('tipo_evento', 'carta_correcao')
      .order('numero_sequencial', { ascending: false })
      .limit(1);

    let numeroSeq = numeroSequencial;
    if (!numeroSeq) {
      numeroSeq = eventosAnteriores && eventosAnteriores.length > 0 
        ? (eventosAnteriores[0].numero_sequencial || 0) + 1 
        : 1;
    }

    if (numeroSeq > 20) {
      throw new Error('Número máximo de Cartas de Correção (20) atingido para esta NFe');
    }

    console.log('Número sequencial da CC-e:', numeroSeq);

    // Simular comunicação com SEFAZ
    // Em produção, aqui você faria a chamada real para o webservice da SEFAZ
    console.log('Enviando CC-e para SEFAZ...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const protocolo = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const dataEvento = new Date().toISOString();

    // Resposta simulada da SEFAZ
    const sefazResponse = {
      status: 'success',
      codigo_retorno: '135',
      mensagem: 'Evento registrado e vinculado a NF-e',
      protocolo: protocolo,
      data_registro: dataEvento,
    };

    console.log('Resposta SEFAZ:', sefazResponse);

    // Registrar evento no banco
    const { error: eventoError } = await supabaseClient
      .from('nfe_eventos')
      .insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        tipo_evento: 'carta_correcao',
        descricao: correcao,
        protocolo: protocolo,
        data_evento: dataEvento,
        numero_sequencial: numeroSeq,
        xml_evento: {
          correcao: correcao,
          numero_sequencial: numeroSeq,
          sefaz_response: sefazResponse,
        },
        usuario_id: user.id,
      });

    if (eventoError) {
      console.error('Erro ao registrar evento:', eventoError);
      throw new Error('Erro ao registrar Carta de Correção');
    }

    console.log('Carta de Correção registrada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Carta de Correção registrada com sucesso',
        protocolo: protocolo,
        numero_sequencial: numeroSeq,
        data_evento: dataEvento,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao processar Carta de Correção:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
