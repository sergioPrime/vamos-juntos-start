import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nfeId, chaveAcesso } = await req.json()

    if (!nfeId || !chaveAcesso) {
      return new Response(
        JSON.stringify({ error: 'NFe ID e chave de acesso são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Consultando status da NFe:', chaveAcesso)

    // TODO: Integrar com SEFAZ real
    // Por enquanto, simular consulta
    const statusResponse = await simulateStatusQuery(chaveAcesso)

    // Atualizar status no banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: updateError } = await supabase
      .from('fiscal_nfe')
      .update({
        status: statusResponse.status,
        protocolo_autorizacao: statusResponse.protocolo,
        data_autorizacao: statusResponse.dataAutorizacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfeId)

    if (updateError) {
      throw new Error('Erro ao atualizar status da NFe')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...statusResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error consulting NFe status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function simulateStatusQuery(chaveAcesso: string) {
  // Simular consulta à SEFAZ
  await new Promise(resolve => setTimeout(resolve, 1000))

  const statuses = ['autorizada', 'rejeitada', 'cancelada', 'denegada']
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

  return {
    status: randomStatus,
    protocolo: `${Math.floor(Math.random() * 1000000000000000)}`,
    dataAutorizacao: new Date().toISOString(),
    motivo: randomStatus === 'rejeitada' 
      ? 'Duplicidade de NFe [nRec:123456789]'
      : randomStatus === 'denegada'
      ? 'Irregularidade fiscal do emitente'
      : 'NFe autorizada com sucesso',
    mensagem: `Consulta realizada com sucesso. Status: ${randomStatus}`
  }
}
