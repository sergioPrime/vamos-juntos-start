import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import React from "npm:react@18.3.1";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { NFeEmail } from "./_templates/nfe-email.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { nfeId, destinatarioEmail, mensagemAdicional } = await req.json();

    console.log('Enviando email da NFe:', nfeId);

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('fiscal_nfe')
      .select('*')
      .eq('id', nfeId)
      .single();

    if (nfeError) throw nfeError;

    // Buscar configuração fiscal para dados da empresa
    const { data: config, error: configError } = await supabaseClient
      .from('fiscal_config')
      .select('*')
      .eq('org_id', nfe.org_id)
      .single();

    if (configError) throw configError;

    // Gerar DANFE PDF (chamar edge function)
    const danfeResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/gerar-danfe`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nfeId }),
      }
    );

    if (!danfeResponse.ok) {
      throw new Error('Erro ao gerar DANFE');
    }

    const danfePdfBase64 = await danfeResponse.text();

    // Gerar XML da NFe (simulado - em produção, buscar o XML real assinado)
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${nfe.chave_acesso}">
      <ide>
        <cNF>${nfe.numero}</cNF>
        <natOp>${nfe.natureza_operacao}</natOp>
        <serie>${nfe.serie}</serie>
        <nNF>${nfe.numero}</nNF>
        <dhEmi>${nfe.data_emissao}</dhEmi>
      </ide>
      <emit>
        <CNPJ>${config.cnpj}</CNPJ>
        <xNome>${config.razao_social}</xNome>
      </emit>
      <dest>
        <xNome>${nfe.destinatario_nome}</xNome>
      </dest>
    </infNFe>
  </NFe>
</nfeProc>`;

    const xmlBase64 = btoa(xmlContent);

    // Renderizar template de email
    const emailHtml = await renderAsync(
      React.createElement(NFeEmail, {
        cliente_nome: nfe.destinatario_nome,
        numero_nfe: nfe.numero.toString(),
        serie_nfe: nfe.serie,
        chave_acesso: nfe.chave_acesso,
        valor_total: parseFloat(nfe.valor_total_nota),
        data_emissao: nfe.data_emissao,
        empresa_nome: config.razao_social,
        empresa_cnpj: config.cnpj,
        empresa_email: config.email,
        empresa_telefone: config.telefone,
        mensagem_adicional: mensagemAdicional,
      })
    );

    // Email do destinatário (usar o fornecido ou o da NFe)
    const emailDestinatario = destinatarioEmail || nfe.destinatario_email;

    if (!emailDestinatario) {
      throw new Error('Email do destinatário não informado');
    }

    // Enviar email com Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${config.razao_social} <onboarding@resend.dev>`, // Trocar por seu domínio validado
      to: [emailDestinatario],
      subject: `NFe ${nfe.numero}/${nfe.serie} - ${config.razao_social}`,
      html: emailHtml,
      attachments: [
        {
          filename: `NFe_${nfe.numero}_${nfe.serie}.xml`,
          content: xmlBase64,
        },
        {
          filename: `DANFE_${nfe.numero}_${nfe.serie}.pdf`,
          content: danfePdfBase64,
        },
      ],
    });

    if (emailError) {
      throw emailError;
    }

    // Registrar envio no banco
    await supabaseClient
      .from('fiscal_nfe_emails')
      .insert({
        nfe_id: nfeId,
        org_id: nfe.org_id,
        destinatario_email: emailDestinatario,
        assunto: `NFe ${nfe.numero}/${nfe.serie} - ${config.razao_social}`,
        mensagem: mensagemAdicional || '',
        enviado_em: new Date().toISOString(),
      });

    console.log('Email enviado com sucesso:', emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        emailId: emailData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in enviar-email-nfe:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});