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
    const { nfeId, destinatarioEmail, mensagemAdicional } = await req.json()

    if (!nfeId || !destinatarioEmail) {
      return new Response(
        JSON.stringify({ error: 'NFe ID e email do destinatário são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(destinatarioEmail)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Enviando NFe por email para:', destinatarioEmail)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabase
      .from('fiscal_nfe')
      .select('*, companies(*)')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada')
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFe autorizadas podem ser enviadas por email')
    }

    // TODO: Integrar com serviço de email real (SendGrid, AWS SES, etc)
    // Por enquanto, simular envio
    const emailResponse = await simulateEmailSend(
      destinatarioEmail,
      nfe,
      mensagemAdicional
    )

    // Registrar envio no banco
    const { error: insertError } = await supabase
      .from('fiscal_nfe_emails')
      .insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        destinatario_email: destinatarioEmail,
        mensagem_adicional: mensagemAdicional,
        status_envio: 'enviado',
        data_envio: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error registering email:', insertError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...emailResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function simulateEmailSend(
  destinatarioEmail: string,
  nfe: any,
  mensagemAdicional?: string
) {
  // Simular envio de email
  await new Promise(resolve => setTimeout(resolve, 1000))

  const assunto = `NFe ${nfe.numero} - ${nfe.companies?.name || 'Empresa'}`
  const corpo = `
    Prezado(a),
    
    Segue em anexo a Nota Fiscal Eletrônica nº ${nfe.numero}, série ${nfe.serie}.
    
    Chave de Acesso: ${nfe.chave_acesso}
    Data de Emissão: ${new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
    Valor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfe.valor_total_nota)}
    
    ${mensagemAdicional ? `\nMensagem adicional:\n${mensagemAdicional}` : ''}
    
    Atenciosamente,
    ${nfe.companies?.name || 'Empresa'}
  `

  console.log('Email simulado enviado para:', destinatarioEmail)
  console.log('Assunto:', assunto)
  console.log('Corpo:', corpo)

  return {
    mensagem: 'Email enviado com sucesso',
    destinatario: destinatarioEmail,
    dataEnvio: new Date().toISOString()
  }
}
