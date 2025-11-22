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
    const { cceId, nfeId, chaveAcesso } = await req.json()

    if (!cceId || !nfeId) {
      return new Response(
        JSON.stringify({ error: 'CCe ID e NFe ID são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados da CCe
    const { data: cce, error: cceError } = await supabase
      .from('fiscal_nfe_cce')
      .select('*')
      .eq('id', cceId)
      .single()

    if (cceError || !cce) {
      throw new Error('Carta de Correção não encontrada')
    }

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabase
      .from('fiscal_nfe')
      .select('*, companies(*)')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada')
    }

    // Gerar QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(chaveAcesso || '')}`

    // Gerar HTML da CCe
    const cceHtml = generateCCeHtml(cce, nfe, chaveAcesso, qrCodeUrl)

    return new Response(
      JSON.stringify({ 
        success: true,
        html: cceHtml,
        sequencia: cce.sequencia
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error generating CCe PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateCCeHtml(cce: any, nfe: any, chaveAcesso: string, qrCodeUrl: string): string {
  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CC-e ${cce.sequencia} - NFe ${nfe.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 10pt; 
      padding: 20px;
      background-color: #f5f5f5;
    }
    .cce-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #000;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18pt;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 11pt;
      color: #666;
    }
    .section {
      margin-bottom: 20px;
      border: 1px solid #ccc;
      padding: 15px;
      background-color: #fafafa;
    }
    .section-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ccc;
      color: #333;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .info-field {
      margin-bottom: 8px;
    }
    .info-label {
      font-size: 8pt;
      color: #666;
      display: block;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 10pt;
      font-weight: bold;
    }
    .chave-acesso {
      text-align: center;
      padding: 15px;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      margin: 15px 0;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 1px;
      word-break: break-all;
    }
    .correcao-box {
      border: 2px solid #0066cc;
      padding: 15px;
      margin: 15px 0;
      background-color: #f0f8ff;
      border-radius: 5px;
    }
    .correcao-box .title {
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
      font-size: 11pt;
    }
    .correcao-text {
      line-height: 1.6;
      text-align: justify;
      white-space: pre-wrap;
    }
    .qr-section {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #000;
      font-size: 8pt;
      color: #666;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 15px;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 10px;
    }
    .status-registrado {
      background-color: #22c55e;
      color: white;
    }
    .status-pendente {
      background-color: #f59e0b;
      color: white;
    }
    @media print {
      body { padding: 0; background: white; }
      .cce-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="cce-container">
    <div class="header">
      <h1>CARTA DE CORREÇÃO ELETRÔNICA - CC-e</h1>
      <p>Sequência ${cce.sequencia}</p>
      <span class="status-badge status-${cce.status}">${cce.status.toUpperCase()}</span>
    </div>

    <div class="section">
      <div class="section-title">DADOS DO EMITENTE</div>
      <div class="info-grid">
        <div class="info-field">
          <span class="info-label">RAZÃO SOCIAL / NOME</span>
          <span class="info-value">${nfe.companies?.name || 'Não informado'}</span>
        </div>
        <div class="info-field">
          <span class="info-label">CNPJ</span>
          <span class="info-value">${nfe.companies?.document || 'Não informado'}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">DADOS DA NFe</div>
      <div class="info-grid">
        <div class="info-field">
          <span class="info-label">NÚMERO DA NFe</span>
          <span class="info-value">${nfe.numero}</span>
        </div>
        <div class="info-field">
          <span class="info-label">SÉRIE</span>
          <span class="info-value">${nfe.serie}</span>
        </div>
        <div class="info-field">
          <span class="info-label">DATA DE EMISSÃO</span>
          <span class="info-value">${formatDate(nfe.data_emissao)}</span>
        </div>
        <div class="info-field">
          <span class="info-label">MODELO</span>
          <span class="info-value">${nfe.modelo}</span>
        </div>
      </div>
    </div>

    <div class="chave-acesso">
      <div style="font-size: 9pt; margin-bottom: 5px; color: #666;">CHAVE DE ACESSO DA NFe</div>
      ${chaveAcesso}
    </div>

    <div class="section">
      <div class="section-title">DADOS DO EVENTO</div>
      <div class="info-grid">
        <div class="info-field">
          <span class="info-label">DATA E HORA DO EVENTO</span>
          <span class="info-value">${formatDate(cce.data_evento)}</span>
        </div>
        <div class="info-field">
          <span class="info-label">PROTOCOLO DE AUTORIZAÇÃO</span>
          <span class="info-value">${cce.protocolo || 'Aguardando autorização'}</span>
        </div>
        <div class="info-field">
          <span class="info-label">SEQUÊNCIA DO EVENTO</span>
          <span class="info-value">${cce.sequencia}</span>
        </div>
        <div class="info-field">
          <span class="info-label">TIPO DO EVENTO</span>
          <span class="info-value">110110 - Carta de Correção</span>
        </div>
      </div>
    </div>

    <div class="correcao-box">
      <div class="title">TEXTO DA CORREÇÃO</div>
      <div class="correcao-text">${cce.correcao}</div>
    </div>

    <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 5px;">
      <div style="font-weight: bold; margin-bottom: 5px;">⚠️ OBSERVAÇÕES IMPORTANTES:</div>
      <ul style="margin-left: 20px; line-height: 1.8; font-size: 9pt;">
        <li>A Carta de Correção é disciplinada pelo § 1º-A do art. 7º do Convênio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularização de erro ocorrido na emissão de documento fiscal, desde que o erro não esteja relacionado com:</li>
        <li style="margin-left: 15px;">I - as variáveis que determinam o valor do imposto tais como: base de cálculo, alíquota, diferença de preço, quantidade, valor da operação ou da prestação;</li>
        <li style="margin-left: 15px;">II - a correção de dados cadastrais que implique mudança do remetente ou do destinatário;</li>
        <li style="margin-left: 15px;">III - a data de emissão ou de saída.</li>
      </ul>
    </div>

    <div class="qr-section">
      <img src="${qrCodeUrl}" alt="QR Code da NFe" style="margin: 10px auto;">
      <p style="font-size: 8pt; color: #666;">Consulte a autenticidade no Portal da NFe</p>
    </div>

    <div class="footer">
      <p><strong>Documento Auxiliar da Carta de Correção Eletrônica</strong></p>
      <p>Este documento não tem validade fiscal. Consulte a autenticidade no site da SEFAZ</p>
      <p style="margin-top: 5px;">Gerado pelo sistema PrimeGestor ERP em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `
}
