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

    const { nfeId, chaveAcesso } = await req.json();

    if (!nfeId && !chaveAcesso) {
      throw new Error('NFe ID ou Chave de Acesso é obrigatório');
    }

    console.log('Consultando status na SEFAZ...');

    let nfe;
    if (nfeId) {
      const { data, error } = await supabaseClient
        .from('nfe')
        .select(`
          *,
          fiscal_config!inner(*)
        `)
        .eq('id', nfeId)
        .single();

      if (error || !data) {
        throw new Error('NFe não encontrada');
      }
      nfe = data;
    } else {
      // Buscar por chave de acesso
      const { data, error } = await supabaseClient
        .from('nfe')
        .select(`
          *,
          fiscal_config!inner(*)
        `)
        .eq('chave_acesso', chaveAcesso)
        .single();

      if (error || !data) {
        throw new Error('NFe não encontrada com esta chave de acesso');
      }
      nfe = data;
    }

    console.log('NFe encontrada:', nfe.numero);

    // Simular consulta à SEFAZ
    // Em produção, aqui você faria a chamada real ao webservice da SEFAZ
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Resposta simulada baseada no status atual
    let sefazResponse;
    
    if (nfe.status === 'autorizada') {
      sefazResponse = {
        status: 'autorizada',
        codigo_status: '100',
        mensagem: 'Autorizado o uso da NF-e',
        protocolo: nfe.protocolo_autorizacao,
        data_autorizacao: nfe.data_autorizacao,
        digest_value: nfe.digest_value,
      };
    } else if (nfe.status === 'cancelada') {
      sefazResponse = {
        status: 'cancelada',
        codigo_status: '101',
        mensagem: 'Cancelamento de NF-e homologado',
        protocolo: nfe.protocolo_cancelamento,
        data_cancelamento: nfe.data_cancelamento,
        motivo_cancelamento: nfe.motivo_cancelamento,
      };
    } else if (nfe.status === 'rejeitada') {
      sefazResponse = {
        status: 'rejeitada',
        codigo_status: nfe.codigo_rejeicao || '999',
        mensagem: nfe.motivo_rejeicao || 'Rejeição não especificada',
        data_rejeicao: nfe.created_at,
      };
    } else {
      sefazResponse = {
        status: 'pendente',
        codigo_status: '105',
        mensagem: 'Lote em processamento',
        recibo: nfe.recibo_lote || `REC${Date.now()}`,
      };
    }

    // Buscar eventos relacionados
    const { data: eventos } = await supabaseClient
      .from('nfe_eventos')
      .select('*')
      .eq('nfe_id', nfe.id)
      .order('data_evento', { ascending: false });

    console.log('Consulta realizada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        nfe: {
          id: nfe.id,
          numero: nfe.numero,
          serie: nfe.serie,
          chave_acesso: nfe.chave_acesso,
          status: nfe.status,
          valor_total: nfe.valor_total,
          data_emissao: nfe.data_emissao,
        },
        sefaz: sefazResponse,
        eventos: eventos || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao consultar status:', error);
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
