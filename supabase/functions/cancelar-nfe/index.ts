import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelamentoRequest {
  nfeId: string;
  justificativa: string;
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

    const { nfeId, justificativa }: CancelamentoRequest = await req.json();

    console.log('Iniciando cancelamento de NFe:', { nfeId, userId: user.id });

    // Validar justificativa
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }

    if (justificativa.length > 255) {
      throw new Error('Justificativa deve ter no máximo 255 caracteres');
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

    // Validar se pode ser cancelada
    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFes autorizadas podem ser canceladas');
    }

    // Verificar prazo de cancelamento (24 horas)
    const dataEmissao = new Date(nfe.data_emissao);
    const horasDesdeEmissao = (Date.now() - dataEmissao.getTime()) / (1000 * 60 * 60);
    
    if (horasDesdeEmissao > 24) {
      throw new Error('Prazo para cancelamento expirado (24 horas após emissão)');
    }

    const fiscalConfig = nfe.fiscal_config;

    // Preparar dados para SEFAZ
    const cancelamentoData = {
      chNFe: nfe.chave_acesso,
      nProt: nfe.numero_protocolo,
      xJust: justificativa,
      tpAmb: fiscalConfig.ambiente === 'producao' ? '1' : '2',
      cnpj: fiscalConfig.cnpj,
      certificado: fiscalConfig.certificate_pfx,
      senhaCertificado: fiscalConfig.certificate_password_encrypted,
    };

    console.log('Enviando cancelamento para SEFAZ:', { 
      chave: nfe.chave_acesso,
      ambiente: fiscalConfig.ambiente 
    });

    // TODO: Integração real com SEFAZ
    // Por enquanto, simulação para desenvolvimento
    const sefazResponse = await simularCancelamentoSEFAZ(cancelamentoData);

    if (sefazResponse.success) {
      // Atualizar NFe no banco
      const { error: updateError } = await supabaseClient
        .from('nfe')
        .update({
          status: 'cancelada',
          motivo_cancelamento: justificativa,
          data_cancelamento: new Date().toISOString(),
          protocolo_cancelamento: sefazResponse.protocolo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nfeId);

      if (updateError) {
        console.error('Erro ao atualizar NFe:', updateError);
        throw new Error('Erro ao atualizar status da NFe');
      }

      // Criar evento de cancelamento
      await supabaseClient.from('nfe_eventos').insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        tipo_evento: 'cancelamento',
        descricao: justificativa,
        protocolo: sefazResponse.protocolo,
        data_evento: new Date().toISOString(),
        created_by: user.id,
      });

      console.log('NFe cancelada com sucesso:', { nfeId, protocolo: sefazResponse.protocolo });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'NFe cancelada com sucesso',
          protocolo: sefazResponse.protocolo,
          data: sefazResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(sefazResponse.mensagem || 'Erro ao cancelar NFe na SEFAZ');
    }
  } catch (error) {
    console.error('Erro no cancelamento:', error);
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

// Simulação de cancelamento SEFAZ para desenvolvimento
async function simularCancelamentoSEFAZ(data: any) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simular resposta da SEFAZ
  const sucesso = Math.random() > 0.1; // 90% de sucesso

  if (sucesso) {
    return {
      success: true,
      protocolo: `999${Math.floor(Math.random() * 1000000000000000)}`,
      mensagem: 'Cancelamento de NF-e homologado',
      dataHora: new Date().toISOString(),
    };
  } else {
    return {
      success: false,
      mensagem: 'Rejeição: NFe já cancelada anteriormente',
      codigo: '573',
    };
  }
}
