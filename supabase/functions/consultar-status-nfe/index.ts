import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsultaStatusRequest {
  nfeId: string;
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

    const { nfeId }: ConsultaStatusRequest = await req.json();

    console.log('Consultando status na SEFAZ:', { nfeId, userId: user.id });

    // Buscar NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*, fiscal_config!inner(*)')
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada');
    }

    const fiscalConfig = nfe.fiscal_config;

    // Preparar dados para consulta SEFAZ
    const consultaData = {
      chNFe: nfe.chave_acesso,
      tpAmb: fiscalConfig.ambiente === 'producao' ? '1' : '2',
      cnpj: fiscalConfig.cnpj,
      certificado: fiscalConfig.certificate_pfx,
      senhaCertificado: fiscalConfig.certificate_password_encrypted,
    };

    console.log('Consultando SEFAZ:', { 
      chave: nfe.chave_acesso,
      ambiente: fiscalConfig.ambiente 
    });

    // TODO: Integração real com SEFAZ
    // Por enquanto, simulação para desenvolvimento
    const sefazResponse = await simularConsultaSEFAZ(consultaData, nfe);

    if (sefazResponse.success) {
      // Atualizar status no banco se houver mudança
      if (sefazResponse.statusNFe !== nfe.status) {
        const updateData: any = {
          status: sefazResponse.statusNFe,
          updated_at: new Date().toISOString(),
        };

        // Se foi autorizada, atualizar protocolo
        if (sefazResponse.statusNFe === 'autorizada' && sefazResponse.protocolo) {
          updateData.numero_protocolo = sefazResponse.protocolo;
          updateData.data_autorizacao = sefazResponse.dhRecbto;
        }

        // Se foi cancelada
        if (sefazResponse.statusNFe === 'cancelada' && sefazResponse.protocoloCancelamento) {
          updateData.protocolo_cancelamento = sefazResponse.protocoloCancelamento;
          updateData.data_cancelamento = sefazResponse.dhEventoCancelamento;
        }

        const { error: updateError } = await supabaseClient
          .from('nfe')
          .update(updateData)
          .eq('id', nfeId);

        if (updateError) {
          console.error('Erro ao atualizar status:', updateError);
        } else {
          console.log('Status atualizado:', { nfeId, novoStatus: sefazResponse.statusNFe });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Consulta realizada com sucesso',
          data: sefazResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(sefazResponse.mensagem || 'Erro ao consultar status na SEFAZ');
    }
  } catch (error) {
    console.error('Erro na consulta:', error);
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

// Simulação de consulta SEFAZ para desenvolvimento
async function simularConsultaSEFAZ(data: any, nfe: any) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simular diferentes cenários baseado no status atual
  const cenarios = [
    {
      // NFe autorizada
      condition: nfe.status === 'autorizada' && !nfe.protocolo_cancelamento,
      response: {
        success: true,
        statusNFe: 'autorizada',
        cStat: '100',
        xMotivo: 'Autorizado o uso da NF-e',
        protocolo: nfe.numero_protocolo || `143${Math.floor(Math.random() * 1000000000000000)}`,
        dhRecbto: nfe.data_autorizacao || new Date().toISOString(),
        digest: Math.random().toString(36).substring(2, 15),
      }
    },
    {
      // NFe cancelada
      condition: nfe.status === 'cancelada' || nfe.protocolo_cancelamento,
      response: {
        success: true,
        statusNFe: 'cancelada',
        cStat: '101',
        xMotivo: 'Cancelamento de NF-e homologado',
        protocolo: nfe.numero_protocolo,
        dhRecbto: nfe.data_autorizacao,
        protocoloCancelamento: nfe.protocolo_cancelamento || `135${Math.floor(Math.random() * 1000000000000000)}`,
        dhEventoCancelamento: nfe.data_cancelamento || new Date().toISOString(),
        motivoCancelamento: nfe.motivo_cancelamento || 'Cancelamento solicitado',
      }
    },
    {
      // NFe pendente/processamento
      condition: nfe.status === 'pendente',
      response: {
        success: true,
        statusNFe: 'pendente',
        cStat: '105',
        xMotivo: 'Lote em processamento',
        numeroLote: Math.floor(Math.random() * 1000000),
      }
    },
    {
      // NFe rejeitada
      condition: nfe.status === 'rejeitada',
      response: {
        success: true,
        statusNFe: 'rejeitada',
        cStat: '539',
        xMotivo: 'Duplicidade de NF-e',
        dhRecbto: new Date().toISOString(),
      }
    }
  ];

  // Encontrar cenário correspondente
  const cenario = cenarios.find(c => c.condition);
  
  if (cenario) {
    return cenario.response;
  }

  // Cenário padrão (não encontrado na SEFAZ)
  return {
    success: true,
    statusNFe: 'nao_encontrada',
    cStat: '217',
    xMotivo: 'NF-e não consta na base de dados da SEFAZ',
  };
}
