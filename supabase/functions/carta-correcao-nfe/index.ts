import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartaCorrecaoRequest {
  nfeId: string;
  correcao: string;
  sequencia?: number;
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

    const { nfeId, correcao, sequencia = 1 }: CartaCorrecaoRequest = await req.json();

    console.log('Iniciando CC-e:', { nfeId, sequencia, userId: user.id });

    // Validar correção
    if (!correcao || correcao.length < 15) {
      throw new Error('Correção deve ter no mínimo 15 caracteres');
    }

    if (correcao.length > 1000) {
      throw new Error('Correção deve ter no máximo 1000 caracteres');
    }

    // Buscar NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*, fiscal_config!inner(*)')
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada');
    }

    // Validar se pode ter CC-e
    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFes autorizadas podem ter Carta de Correção');
    }

    if (nfe.status === 'cancelada') {
      throw new Error('NFe cancelada não pode ter Carta de Correção');
    }

    // Buscar sequência atual (quantas CC-e já foram enviadas)
    const { count: ccCount } = await supabaseClient
      .from('nfe_eventos')
      .select('*', { count: 'exact', head: true })
      .eq('nfe_id', nfeId)
      .eq('tipo_evento', 'carta_correcao');

    const novaSequencia = (ccCount || 0) + 1;

    const fiscalConfig = nfe.fiscal_config;

    // Preparar dados para SEFAZ
    const ccData = {
      chNFe: nfe.chave_acesso,
      nSeqEvento: novaSequencia,
      xCorrecao: correcao,
      tpAmb: fiscalConfig.ambiente === 'producao' ? '1' : '2',
      cnpj: fiscalConfig.cnpj,
      certificado: fiscalConfig.certificate_pfx,
      senhaCertificado: fiscalConfig.certificate_password_encrypted,
      dhEvento: new Date().toISOString(),
    };

    console.log('Enviando CC-e para SEFAZ:', { 
      chave: nfe.chave_acesso,
      sequencia: novaSequencia,
      ambiente: fiscalConfig.ambiente 
    });

    // TODO: Integração real com SEFAZ
    // Por enquanto, simulação para desenvolvimento
    const sefazResponse = await simularCCeSEFAZ(ccData);

    if (sefazResponse.success) {
      // Criar evento de carta de correção
      const { error: eventoError } = await supabaseClient
        .from('nfe_eventos')
        .insert({
          nfe_id: nfeId,
          org_id: nfe.org_id,
          tipo_evento: 'carta_correcao',
          descricao: correcao,
          protocolo: sefazResponse.protocolo,
          data_evento: new Date().toISOString(),
          created_by: user.id,
        });

      if (eventoError) {
        console.error('Erro ao criar evento:', eventoError);
        throw new Error('Erro ao registrar CC-e');
      }

      console.log('CC-e registrada com sucesso:', { 
        nfeId, 
        sequencia: novaSequencia,
        protocolo: sefazResponse.protocolo 
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Carta de Correção enviada com sucesso',
          protocolo: sefazResponse.protocolo,
          sequencia: novaSequencia,
          data: sefazResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(sefazResponse.mensagem || 'Erro ao enviar CC-e para SEFAZ');
    }
  } catch (error) {
    console.error('Erro na CC-e:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Simulação de CC-e SEFAZ para desenvolvimento
async function simularCCeSEFAZ(data: any) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simular resposta da SEFAZ
  const sucesso = Math.random() > 0.05; // 95% de sucesso

  if (sucesso) {
    return {
      success: true,
      protocolo: `135${Math.floor(Math.random() * 1000000000000000)}`,
      mensagem: 'Evento registrado e vinculado a NF-e',
      dataHora: new Date().toISOString(),
      cStat: '135', // Código de sucesso para CC-e
    };
  } else {
    return {
      success: false,
      mensagem: 'Rejeição: Duplicidade de evento',
      codigo: '593',
      cStat: '593',
    };
  }
}
