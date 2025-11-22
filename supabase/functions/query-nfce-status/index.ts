import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { chave_acesso } = await req.json()

    console.log('[query-nfce-status] Consultando NFC-e:', { chave_acesso })

    // Buscar NFC-e pela chave de acesso
    const { data: nfce, error: nfceError } = await supabase
      .from('nfce')
      .select('*')
      .eq('chave_acesso', chave_acesso)
      .single()

    if (nfceError || !nfce) {
      throw new Error('NFC-e não encontrada')
    }

    // Em produção, aqui seria feita a consulta real na SEFAZ
    // Por enquanto, retornar o status atual do banco

    console.log('[query-nfce-status] NFC-e encontrada:', { 
      id: nfce.id, 
      status: nfce.status 
    })

    return new Response(
      JSON.stringify({
        success: true,
        nfce: {
          chave_acesso: nfce.chave_acesso,
          numero: nfce.numero,
          serie: nfce.serie,
          status: nfce.status,
          protocolo: nfce.protocolo,
          data_emissao: nfce.data_emissao,
          data_autorizacao: nfce.data_autorizacao,
          valor_total: nfce.valor_total
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[query-nfce-status] Erro:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})