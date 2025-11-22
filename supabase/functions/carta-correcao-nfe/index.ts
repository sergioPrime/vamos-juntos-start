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
    const { nfeId, chaveAcesso, correcao } = await req.json()

    if (!nfeId || !chaveAcesso || !correcao) {
      return new Response(
        JSON.stringify({ error: 'NFe ID, chave de acesso e texto de correção são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (correcao.length < 15 || correcao.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'A correção deve ter entre 15 e 1000 caracteres' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Emitindo carta de correção para NFe:', chaveAcesso)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar se NFe existe e está autorizada
    const { data: nfe, error: nfeError } = await supabase
      .from('fiscal_nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada')
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFe autorizadas podem receber carta de correção')
    }

    // TODO: Integrar com SEFAZ real
    // Por enquanto, simular emissão de CCe
    const cceResponse = await simulateCCe(chaveAcesso, correcao)

    // Salvar carta de correção no banco
    const { error: insertError } = await supabase
      .from('fiscal_nfe_cce')
      .insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        sequencia: cceResponse.sequencia,
        correcao: correcao,
        protocolo: cceResponse.protocolo,
        data_evento: new Date().toISOString(),
        status: 'registrado'
      })

    if (insertError) {
      throw new Error('Erro ao salvar carta de correção')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...cceResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error creating CCe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function simulateCCe(chaveAcesso: string, correcao: string) {
  // Simular emissão de CCe na SEFAZ
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    protocolo: `${Math.floor(Math.random() * 1000000000000000)}`,
    sequencia: 1,
    dataEvento: new Date().toISOString(),
    mensagem: 'Evento registrado e vinculado a NFe',
    correcao
  }
}
