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
    const { nfeId, chaveAcesso, justificativa } = await req.json()

    if (!nfeId || !chaveAcesso || !justificativa) {
      return new Response(
        JSON.stringify({ error: 'NFe ID, chave de acesso e justificativa são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (justificativa.length < 15) {
      return new Response(
        JSON.stringify({ error: 'A justificativa deve ter no mínimo 15 caracteres' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Cancelando NFe:', chaveAcesso)

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
      throw new Error('Apenas NFe autorizadas podem ser canceladas')
    }

    // Verificar se está dentro do prazo de 24h
    const dataEmissao = new Date(nfe.data_emissao)
    const horasDesdeEmissao = (Date.now() - dataEmissao.getTime()) / (1000 * 60 * 60)

    if (horasDesdeEmissao > 24) {
      throw new Error('O prazo de 24 horas para cancelamento foi excedido')
    }

    // TODO: Integrar com SEFAZ real
    // Por enquanto, simular cancelamento
    const cancelamentoResponse = await simulateCancellation(chaveAcesso, justificativa)

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('fiscal_nfe')
      .update({
        status: 'cancelada',
        protocolo_cancelamento: cancelamentoResponse.protocolo,
        data_cancelamento: new Date().toISOString(),
        justificativa_cancelamento: justificativa,
        updated_at: new Date().toISOString()
      })
      .eq('id', nfeId)

    if (updateError) {
      throw new Error('Erro ao atualizar status da NFe')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...cancelamentoResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error canceling NFe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function simulateCancellation(chaveAcesso: string, justificativa: string) {
  // Simular cancelamento na SEFAZ
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    protocolo: `${Math.floor(Math.random() * 1000000000000000)}`,
    dataCancelamento: new Date().toISOString(),
    mensagem: 'Cancelamento de NFe homologado',
    justificativa
  }
}
