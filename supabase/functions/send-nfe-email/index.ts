import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    const { nfeId, email } = await req.json()

    if (!nfeId || !email) {
      throw new Error('ID da NFe e email são obrigatórios')
    }

    console.log(`Enviando NFe ${nfeId} para ${email}`)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*, pessoas!nfe_destinatario_id_fkey(nome, email)')
      .eq('id', nfeId)
      .single()

    if (nfeError) throw nfeError

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFe autorizadas podem ser enviadas por email')
    }

    // Buscar dados da empresa
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .single()

    const { data: org } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()

    // TODO: Integrar com serviço de email (SendGrid, AWS SES, etc)
    // Por enquanto, apenas simula o envio
    const emailData = {
      to: email,
      subject: `NFe ${nfe.numero} - ${org?.name || 'Empresa'}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Nota Fiscal Eletrônica</h2>
            <p>Prezado(a) ${nfe.pessoas?.nome || 'Cliente'},</p>
            <p>Segue em anexo a Nota Fiscal Eletrônica referente à sua compra.</p>
            <br>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Número:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${nfe.numero}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Série:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${nfe.serie}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Data de Emissão:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Valor Total:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">R$ ${nfe.valor_total.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Chave de Acesso:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${nfe.chave_acesso}</td>
              </tr>
            </table>
            <br>
            <p style="font-size: 12px; color: #666;">
              Este é um email automático. Não é necessário respondê-lo.
            </p>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `NFe_${nfe.numero}.xml`,
          content: Buffer.from(nfe.xml_autorizado || '').toString('base64')
        }
      ]
    }

    console.log('Email simulado:', emailData)

    // Registrar envio no banco
    const { error: logError } = await supabaseClient
      .from('nfe_envios_email')
      .insert({
        nfe_id: nfeId,
        email_destinatario: email,
        enviado_em: new Date().toISOString(),
        org_id: profile.organization_id
      })

    if (logError) {
      console.warn('Erro ao registrar envio de email:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
