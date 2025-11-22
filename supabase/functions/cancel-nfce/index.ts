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

    const { nfce_id, motivo } = await req.json()

    console.log('[cancel-nfce] Cancelando NFC-e:', { nfce_id, motivo })

    // Buscar NFC-e
    const { data: nfce, error: nfceError } = await supabase
      .from('nfce')
      .select('*')
      .eq('id', nfce_id)
      .single()

    if (nfceError || !nfce) {
      throw new Error('NFC-e não encontrada')
    }

    if (nfce.status !== 'autorizada') {
      throw new Error('Apenas NFC-e autorizadas podem ser canceladas')
    }

    // Verificar prazo de 24h
    const dataAutorizacao = new Date(nfce.data_autorizacao)
    const agora = new Date()
    const diferencaHoras = (agora.getTime() - dataAutorizacao.getTime()) / (1000 * 60 * 60)

    if (diferencaHoras > 24) {
      throw new Error('Prazo de cancelamento expirado (máximo 24 horas)')
    }

    // Simular cancelamento na SEFAZ
    // Em produção, aqui seria feita a comunicação real com a SEFAZ
    
    const { error: updateError } = await supabase
      .from('nfce')
      .update({
        status: 'cancelada',
        motivo_cancelamento: motivo,
        data_cancelamento: new Date().toISOString()
      })
      .eq('id', nfce_id)

    if (updateError) {
      console.error('[cancel-nfce] Erro ao atualizar status:', updateError)
      throw new Error('Erro ao cancelar NFC-e')
    }

    console.log('[cancel-nfce] NFC-e cancelada com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NFC-e cancelada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[cancel-nfce] Erro:', error)
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