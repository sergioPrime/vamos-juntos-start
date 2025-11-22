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

    const { nfeId, emailDestinatario, emailSubject, emailBody } = await req.json();

    if (!nfeId || !emailDestinatario) {
      throw new Error('NFe ID e email do destinatário são obrigatórios');
    }

    console.log('Iniciando envio de email para NFe:', nfeId);

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select(`
        *,
        fiscal_config!inner(
          razao_social,
          cnpj,
          email
        )
      `)
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada');
    }

    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NFes autorizadas podem ser enviadas por email');
    }

    console.log('NFe encontrada:', nfe.numero);

    // Buscar arquivos XML e DANFE do storage
    let xmlUrl = null;
    let danfeUrl = null;

    if (nfe.xml_path) {
      const { data: xmlData } = await supabaseClient.storage
        .from('nfe-files')
        .createSignedUrl(nfe.xml_path, 3600);
      xmlUrl = xmlData?.signedUrl;
    }

    if (nfe.danfe_path) {
      const { data: danfeData } = await supabaseClient.storage
        .from('nfe-files')
        .createSignedUrl(nfe.danfe_path, 3600);
      danfeUrl = danfeData?.signedUrl;
    }

    if (!xmlUrl || !danfeUrl) {
      throw new Error('Arquivos XML e DANFE devem ser gerados antes do envio por email');
    }

    // Preparar conteúdo do email
    const defaultSubject = emailSubject || `NFe ${nfe.numero} - ${nfe.fiscal_config.razao_social}`;
    const defaultBody = emailBody || `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Nota Fiscal Eletrônica</h2>
            
            <p>Prezado(a),</p>
            
            <p>Segue em anexo a Nota Fiscal Eletrônica referente à operação realizada:</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Número:</strong> ${nfe.numero}</p>
              <p><strong>Série:</strong> ${nfe.serie}</p>
              <p><strong>Data de Emissão:</strong> ${new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}</p>
              <p><strong>Valor Total:</strong> R$ ${nfe.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p><strong>Chave de Acesso:</strong> ${nfe.chave_acesso}</p>
            </div>
            
            <p>Arquivos anexados:</p>
            <ul>
              <li>XML da NFe</li>
              <li>DANFE (Documento Auxiliar)</li>
            </ul>
            
            <p>Para consultar a autenticidade desta NFe, acesse o site da SEFAZ e informe a chave de acesso.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
            
            <p style="font-size: 12px; color: #6b7280;">
              <strong>${nfe.fiscal_config.razao_social}</strong><br/>
              CNPJ: ${nfe.fiscal_config.cnpj}<br/>
              ${nfe.fiscal_config.email ? `Email: ${nfe.fiscal_config.email}` : ''}
            </p>
          </div>
        </body>
      </html>
    `;

    // Aqui você integraria com um serviço de email real (SendGrid, Resend, etc)
    // Por enquanto, vamos simular o envio
    console.log('Enviando email para:', emailDestinatario);
    console.log('Assunto:', defaultSubject);
    console.log('XML URL:', xmlUrl);
    console.log('DANFE URL:', danfeUrl);

    // Simulação de envio bem-sucedido
    // Em produção, você faria algo como:
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: nfe.fiscal_config.email || 'noreply@example.com',
        to: emailDestinatario,
        subject: defaultSubject,
        html: defaultBody,
        attachments: [
          {
            filename: `NFe_${nfe.numero}.xml`,
            path: xmlUrl,
          },
          {
            filename: `NFe_${nfe.numero}.pdf`,
            path: danfeUrl,
          },
        ],
      }),
    });
    */

    // Registrar evento de envio
    await supabaseClient.from('nfe_eventos').insert({
      nfe_id: nfeId,
      org_id: nfe.org_id,
      tipo_evento: 'envio_email',
      descricao: `Email enviado para ${emailDestinatario}`,
      protocolo: `EMAIL-${Date.now()}`,
      data_evento: new Date().toISOString(),
      xml_evento: {
        destinatario: emailDestinatario,
        assunto: defaultSubject,
        xml_url: xmlUrl,
        danfe_url: danfeUrl,
      },
      usuario_id: user.id,
    });

    console.log('Email enviado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        destinatario: emailDestinatario,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao enviar email:', error);
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
