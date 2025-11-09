import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlockchainAlertRequest {
  alert_id: string;
  org_id: string;
  alert_type: string;
  severity: string;
  block_number: number;
  message: string;
  admin_emails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      alert_id,
      org_id,
      alert_type,
      severity,
      block_number,
      message,
      admin_emails,
    }: BlockchainAlertRequest = await req.json();

    console.log("Processing blockchain alert:", {
      alert_id,
      org_id,
      alert_type,
      severity,
      block_number,
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get organization name
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", org_id)
      .single();

    const orgName = orgData?.name || "Sua Organização";

    // Define severity colors and labels
    const severityConfig = {
      low: { color: "#3b82f6", label: "Baixa", emoji: "ℹ️" },
      medium: { color: "#f59e0b", label: "Média", emoji: "⚠️" },
      high: { color: "#ef4444", label: "Alta", emoji: "🚨" },
      critical: { color: "#dc2626", label: "Crítica", emoji: "🔥" },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.high;

    // Send email to all admins
    if (admin_emails && admin_emails.length > 0) {
      for (const email of admin_emails) {
        try {
          const emailResponse = await resend.emails.send({
            from: "Prime Gestor - Segurança <security@primegestor.com>",
            to: [email],
            subject: `${config.emoji} Alerta de Segurança Blockchain - ${config.label}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                    }
                    .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 30px;
                      border-radius: 10px 10px 0 0;
                      text-align: center;
                    }
                    .header h1 {
                      margin: 0;
                      font-size: 24px;
                    }
                    .alert-badge {
                      display: inline-block;
                      background: ${config.color};
                      color: white;
                      padding: 8px 16px;
                      border-radius: 20px;
                      font-weight: bold;
                      margin-top: 10px;
                      font-size: 14px;
                    }
                    .content {
                      background: #f9fafb;
                      padding: 30px;
                      border-radius: 0 0 10px 10px;
                    }
                    .alert-details {
                      background: white;
                      border-left: 4px solid ${config.color};
                      padding: 20px;
                      margin: 20px 0;
                      border-radius: 4px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .alert-details h2 {
                      margin-top: 0;
                      color: ${config.color};
                      font-size: 18px;
                    }
                    .detail-row {
                      display: flex;
                      padding: 10px 0;
                      border-bottom: 1px solid #e5e7eb;
                    }
                    .detail-row:last-child {
                      border-bottom: none;
                    }
                    .detail-label {
                      font-weight: 600;
                      width: 140px;
                      color: #6b7280;
                    }
                    .detail-value {
                      color: #111827;
                      flex: 1;
                    }
                    .cta-button {
                      display: inline-block;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      margin: 20px 0;
                      text-align: center;
                    }
                    .footer {
                      text-align: center;
                      color: #6b7280;
                      font-size: 12px;
                      margin-top: 30px;
                      padding-top: 20px;
                      border-top: 1px solid #e5e7eb;
                    }
                    .warning-box {
                      background: #fef3c7;
                      border: 2px solid #f59e0b;
                      border-radius: 8px;
                      padding: 15px;
                      margin: 20px 0;
                    }
                    .warning-box p {
                      margin: 0;
                      color: #92400e;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>${config.emoji} Alerta de Segurança Blockchain</h1>
                    <div class="alert-badge">Severidade: ${config.label}</div>
                  </div>
                  
                  <div class="content">
                    <p>Olá,</p>
                    
                    <p>
                      Um alerta de segurança foi detectado no sistema blockchain do 
                      <strong>${orgName}</strong>.
                    </p>
                    
                    <div class="alert-details">
                      <h2>Detalhes do Alerta</h2>
                      
                      <div class="detail-row">
                        <div class="detail-label">Tipo de Alerta:</div>
                        <div class="detail-value">${alert_type === 'invalid_block' ? 'Bloco Inválido' : alert_type}</div>
                      </div>
                      
                      <div class="detail-row">
                        <div class="detail-label">Bloco:</div>
                        <div class="detail-value">#${block_number}</div>
                      </div>
                      
                      <div class="detail-row">
                        <div class="detail-label">Mensagem:</div>
                        <div class="detail-value">${message}</div>
                      </div>
                      
                      <div class="detail-row">
                        <div class="detail-label">Data/Hora:</div>
                        <div class="detail-value">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
                      </div>
                    </div>
                    
                    ${severity === 'critical' || severity === 'high' ? `
                    <div class="warning-box">
                      <p>
                        <strong>⚠️ Ação Imediata Necessária:</strong><br>
                        Este é um alerta de alta prioridade que requer sua atenção imediata. 
                        Acesse o painel de controle para verificar os detalhes e tomar as ações necessárias.
                      </p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                      <a href="https://wrdyffwjlylgxfbxbztf.supabase.co/settings/blockchain" class="cta-button">
                        Acessar Painel Blockchain
                      </a>
                    </div>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      <strong>O que fazer?</strong><br>
                      1. Acesse o painel de blockchain no sistema<br>
                      2. Execute uma validação completa da cadeia<br>
                      3. Verifique os detalhes do bloco comprometido<br>
                      4. Tome as ações corretivas necessárias
                    </p>
                  </div>
                  
                  <div class="footer">
                    <p>
                      Este é um email automático do sistema de segurança Prime Gestor.<br>
                      Para questões urgentes, entre em contato com o suporte técnico.
                    </p>
                    <p style="margin-top: 10px;">
                      © ${new Date().getFullYear()} Prime Gestor - Sistema ERP
                    </p>
                  </div>
                </body>
              </html>
            `,
          });

          console.log("Email sent successfully to:", email, emailResponse);
        } catch (emailError) {
          console.error("Error sending email to:", email, emailError);
        }
      }

      // Mark alert as email sent
      await supabase
        .from("blockchain_alerts")
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", alert_id);

      console.log("All emails sent and alert updated");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Blockchain alert notifications sent",
        emails_sent: admin_emails?.length || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-blockchain-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
