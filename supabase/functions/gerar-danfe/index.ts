import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DanfeData {
  nfe: any
  items: any[]
  emitente: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Iniciando geração de DANFE...')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticação
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Erro de autenticação:', userError)
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { nfeId } = await req.json()

    if (!nfeId) {
      return new Response(
        JSON.stringify({ error: 'ID da NFe não fornecido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Buscando dados da NFe:', nfeId)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError) {
      console.error('Erro ao buscar NFe:', nfeError)
      throw nfeError
    }

    // Buscar itens da NFe
    const { data: items, error: itemsError } = await supabaseClient
      .from('nfe_items')
      .select('*')
      .eq('nfe_id', nfeId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError)
      throw itemsError
    }

    // Buscar dados do emitente (empresa)
    const { data: emitente, error: emitenteError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', nfe.company_id)
      .single()

    if (emitenteError) {
      console.error('Erro ao buscar emitente:', emitenteError)
    }

    console.log('Gerando HTML do DANFE...')

    // Gerar HTML do DANFE
    const danfeHtml = generateDanfeHtml({ nfe, items, emitente })

    return new Response(
      danfeHtml,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="DANFE_${nfe.numero}_${nfe.serie}.html"`,
        },
      }
    )

  } catch (error) {
    console.error('Erro ao gerar DANFE:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar DANFE' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateDanfeHtml(data: DanfeData): string {
  const { nfe, items, emitente } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDocument = (doc: string) => {
    if (!doc) return ''
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatAccessKey = (key: string) => {
    if (!key) return ''
    return key.replace(/(\d{4})/g, '$1 ').trim()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR')
  }

  // Gerar QR Code URL (Simplificado - em produção usar biblioteca específica)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nfe.chave_acesso)}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DANFE - NFe ${nfe.numero}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 5mm;
    }
    
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 7pt;
      line-height: 1.2;
      background: white;
      color: #000;
    }
    
    .danfe {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      border: 2px solid #000;
      position: relative;
    }
    
    .section {
      border-bottom: 1px solid #000;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .header {
      display: flex;
      border-bottom: 2px solid #000;
      min-height: 35mm;
    }
    
    .header-left {
      width: 45%;
      border-right: 1px solid #000;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .header-center {
      width: 30%;
      border-right: 1px solid #000;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .header-right {
      width: 25%;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
    }
    
    .title {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .subtitle {
      font-size: 6pt;
      color: #333;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }
    
    .value {
      font-weight: bold;
      font-size: 8pt;
    }
    
    .nfe-type {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 2mm;
      letter-spacing: 2px;
    }
    
    .access-key {
      font-size: 7pt;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      line-height: 1.4;
      margin: 2mm 0;
      padding: 2mm;
      border: 1px solid #ccc;
      background: #f9f9f9;
    }
    
    .grid {
      display: grid;
      gap: 0;
    }
    
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .grid-5 { grid-template-columns: 1fr 1fr 1fr 1fr 1fr; }
    
    .field {
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 1mm;
      min-height: 8mm;
    }
    
    .field:last-child {
      border-right: none;
    }
    
    .field-label {
      font-size: 5pt;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 0.5mm;
      font-weight: bold;
    }
    
    .field-value {
      font-size: 7pt;
      font-weight: bold;
      word-break: break-word;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 1mm;
      text-align: left;
      font-size: 6pt;
    }
    
    th {
      background: #e0e0e0;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    
    .qr-code {
      width: 35mm;
      height: 35mm;
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .barcode-section {
      text-align: center;
      padding: 3mm;
      border-top: 1px solid #000;
    }
    
    .barcode {
      font-family: 'Libre Barcode 128', 'Courier New', monospace;
      font-size: 40pt;
      letter-spacing: 0;
      line-height: 1;
    }
    
    .protocol {
      font-size: 7pt;
      font-weight: bold;
      margin-top: 2mm;
    }
    
    .info-section {
      padding: 2mm;
    }
    
    .destinatario-section {
      padding: 2mm;
    }
    
    .calc-section {
      padding: 2mm;
      background: #f5f5f5;
    }
    
    .produtos-section {
      padding: 2mm;
    }
    
    .footer-info {
      font-size: 5pt;
      text-align: center;
      padding: 2mm;
      color: #666;
    }
    
    @media print {
      body { 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .danfe { 
        page-break-after: always;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="danfe">
    <!-- CABEÇALHO PRINCIPAL -->
    <div class="header">
      <!-- Identificação do Emitente -->
      <div class="header-left">
        <div>
          <div class="title">${emitente?.name || 'EMITENTE'}</div>
          <div style="font-size: 6pt; margin-top: 1mm;">
            ${emitente?.address || 'Endereço do Emitente'}<br>
            ${emitente?.city || 'Cidade'} - ${emitente?.state || 'UF'} - CEP: ${emitente?.zip_code || '00000-000'}<br>
            <strong>CNPJ:</strong> ${emitente?.document ? formatDocument(emitente.document) : '00.000.000/0000-00'}<br>
            ${emitente?.phone ? `<strong>Fone:</strong> ${emitente.phone}<br>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Tipo de Documento -->
      <div class="header-center">
        <div class="nfe-type">DANFE</div>
        <div class="subtitle">Documento Auxiliar da<br>Nota Fiscal Eletrônica</div>
        <div style="margin-top: 3mm;">
          <div class="subtitle">Entrada/Saída</div>
          <div class="value">${nfe.finalidade === 'normal' ? '1 - SAÍDA' : '0 - ENTRADA'}</div>
        </div>
        <div style="margin-top: 3mm; font-size: 5pt;">
          <strong>Nº ${String(nfe.numero).padStart(9, '0')}</strong><br>
          <strong>Série ${nfe.serie}</strong>
        </div>
      </div>
      
      <!-- Código de Barras e QR Code -->
      <div class="header-right">
        <div class="qr-code">
          <img src="${qrCodeUrl}" alt="QR Code NFe" />
        </div>
        <div style="font-size: 5pt; margin-top: 1mm;">
          NF-e nº <strong>${String(nfe.numero).padStart(9, '0')}</strong><br>
          Série <strong>${nfe.serie}</strong>
        </div>
      </div>
    </div>
    
    <!-- CHAVE DE ACESSO -->
    <div class="section" style="padding: 2mm;">
      <div class="subtitle">Chave de Acesso</div>
      <div class="access-key">${formatAccessKey(nfe.chave_acesso)}</div>
      <div style="font-size: 6pt; text-align: center; margin-top: 1mm;">
        Consulta de autenticidade no portal nacional da NF-e<br>
        <strong>www.nfe.fazenda.gov.br/portal</strong> ou no site da Sefaz Autorizadora
      </div>
    </div>
    
    <!-- NATUREZA DA OPERAÇÃO -->
    <div class="section">
      <div class="grid grid-2">
        <div class="field">
          <div class="field-label">Natureza da Operação</div>
          <div class="field-value">${nfe.natureza_operacao || 'Venda de Mercadoria'}</div>
        </div>
        <div class="field">
          <div class="field-label">Protocolo de Autorização de Uso</div>
          <div class="field-value">${nfe.protocolo_autorizacao || 'Aguardando autorização'}</div>
        </div>
      </div>
    </div>
    
    <!-- INSCRIÇÃO ESTADUAL -->
    <div class="section">
      <div class="grid grid-3">
        <div class="field">
          <div class="field-label">Inscrição Estadual</div>
          <div class="field-value">${emitente?.inscricao_estadual || 'ISENTO'}</div>
        </div>
        <div class="field">
          <div class="field-label">Inscrição Estadual do Subst. Tributário</div>
          <div class="field-value">${emitente?.ie_st || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">CNAE Fiscal</div>
          <div class="field-value">${emitente?.cnae || '-'}</div>
        </div>
      </div>
    </div>
    
    <!-- DESTINATÁRIO / REMETENTE -->
    <div class="section destinatario-section">
      <div class="subtitle text-bold">DESTINATÁRIO / REMETENTE</div>
      <div class="grid grid-2" style="margin-top: 1mm;">
        <div class="field">
          <div class="field-label">Nome / Razão Social</div>
          <div class="field-value">${nfe.destinatario_nome || 'CONSUMIDOR FINAL'}</div>
        </div>
        <div class="field">
          <div class="field-label">CPF / CNPJ</div>
          <div class="field-value">${nfe.destinatario_documento ? formatDocument(nfe.destinatario_documento) : '-'}</div>
        </div>
      </div>
      <div class="grid grid-3">
        <div class="field">
          <div class="field-label">Data de Emissão</div>
          <div class="field-value">${formatDateTime(nfe.data_emissao)}</div>
        </div>
        <div class="field">
          <div class="field-label">Data da Entrada/Saída</div>
          <div class="field-value">${formatDateTime(nfe.data_emissao)}</div>
        </div>
        <div class="field">
          <div class="field-label">Hora da Entrada/Saída</div>
          <div class="field-value">${new Date(nfe.data_emissao).toLocaleTimeString('pt-BR')}</div>
        </div>
      </div>
      <div class="grid grid-4">
        <div class="field">
          <div class="field-label">Endereço</div>
          <div class="field-value">${nfe.destinatario_endereco || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Bairro</div>
          <div class="field-value">${nfe.destinatario_bairro || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">Município</div>
          <div class="field-value">${nfe.destinatario_cidade || '-'}</div>
        </div>
        <div class="field">
          <div class="field-label">UF</div>
          <div class="field-value">${nfe.destinatario_uf || '-'}</div>
        </div>
      </div>
    </div>
    
    <!-- PRODUTOS / SERVIÇOS -->
    <div class="section produtos-section">
      <div class="subtitle text-bold">DADOS DOS PRODUTOS / SERVIÇOS</div>
      <table style="margin-top: 1mm;">
        <thead>
          <tr>
            <th style="width: 8%;">CÓDIGO</th>
            <th style="width: 30%;">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
            <th style="width: 7%;">NCM/SH</th>
            <th style="width: 5%;">CST</th>
            <th style="width: 5%;">CFOP</th>
            <th style="width: 5%;">UN</th>
            <th style="width: 8%;">QUANT</th>
            <th style="width: 10%;">V. UNIT</th>
            <th style="width: 12%;">V. TOTAL</th>
            <th style="width: 10%;">V. ICMS</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.produto_codigo || '-'}</td>
              <td>${item.produto_nome || '-'}</td>
              <td class="text-center">${item.ncm || '-'}</td>
              <td class="text-center">${item.cst || '-'}</td>
              <td class="text-center">${item.cfop || '-'}</td>
              <td class="text-center">${item.unidade || 'UN'}</td>
              <td class="text-right">${item.quantidade.toFixed(2)}</td>
              <td class="text-right">${formatCurrency(item.valor_unitario)}</td>
              <td class="text-right text-bold">${formatCurrency(item.valor_total)}</td>
              <td class="text-right">${formatCurrency(item.icms_valor || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- CÁLCULO DO IMPOSTO -->
    <div class="section calc-section">
      <div class="subtitle text-bold">CÁLCULO DO IMPOSTO</div>
      <div class="grid grid-5" style="margin-top: 1mm;">
        <div class="field">
          <div class="field-label">Base de Cálculo do ICMS</div>
          <div class="field-value text-right">${formatCurrency(nfe.bc_icms || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do ICMS</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_icms || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Base de Cálculo do ICMS ST</div>
          <div class="field-value text-right">${formatCurrency(nfe.bc_icms_st || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do ICMS ST</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_icms_st || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor Total dos Produtos</div>
          <div class="field-value text-right text-bold">${formatCurrency(nfe.valor_produtos || 0)}</div>
        </div>
      </div>
      <div class="grid grid-5">
        <div class="field">
          <div class="field-label">Valor do Frete</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_frete || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do Seguro</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_seguro || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Desconto</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_desconto || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Outras Despesas</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_outras_despesas || 0)}</div>
        </div>
        <div class="field" style="background: #d4edda;">
          <div class="field-label">Valor Total da Nota</div>
          <div class="field-value text-right text-bold" style="font-size: 9pt;">${formatCurrency(nfe.valor_total)}</div>
        </div>
      </div>
    </div>
    
    <!-- DADOS ADICIONAIS -->
    <div class="section" style="padding: 2mm; min-height: 20mm;">
      <div class="subtitle text-bold">DADOS ADICIONAIS</div>
      <div class="grid grid-2" style="margin-top: 1mm;">
        <div class="field">
          <div class="field-label">Informações Complementares</div>
          <div class="field-value" style="font-weight: normal; font-size: 6pt;">
            ${nfe.observacoes || 'Documento emitido por ME ou EPP optante pelo Simples Nacional.<br>Não gera direito a crédito fiscal de IPI.<br>'}
          </div>
        </div>
        <div class="field">
          <div class="field-label">Reservado ao Fisco</div>
          <div class="field-value" style="font-weight: normal;">${nfe.info_fisco || ''}</div>
        </div>
      </div>
    </div>
    
    <!-- RODAPÉ -->
    <div class="footer-info">
      <strong>Recebemos de ${emitente?.name || 'EMITENTE'} os produtos/serviços constantes da NFe indicada ao lado</strong><br>
      Data de Recebimento: ______________ Identificação e Assinatura do Recebedor: ____________________________
    </div>
  </div>
</body>
</html>
  `
}
