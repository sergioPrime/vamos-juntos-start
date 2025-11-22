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

    // Por enquanto, retornar o HTML
    // Em produção, isso seria convertido para PDF usando uma biblioteca adequada
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
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      padding: 10mm;
      background: white;
    }
    
    .danfe {
      width: 210mm;
      margin: 0 auto;
      border: 2px solid #000;
    }
    
    .section {
      border-bottom: 1px solid #000;
      padding: 3mm;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .header {
      display: flex;
      gap: 3mm;
      padding: 3mm;
      border-bottom: 2px solid #000;
    }
    
    .header-left {
      flex: 0 0 30%;
      text-align: center;
      border-right: 1px solid #000;
      padding-right: 3mm;
    }
    
    .header-center {
      flex: 1;
      border-right: 1px solid #000;
      padding: 0 3mm;
    }
    
    .header-right {
      flex: 0 0 25%;
      text-align: center;
    }
    
    .title {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    
    .subtitle {
      font-size: 7pt;
      color: #666;
      margin-bottom: 1mm;
    }
    
    .value {
      font-weight: bold;
      font-size: 9pt;
    }
    
    .nfe-type {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    
    .access-key {
      font-size: 9pt;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      line-height: 1.4;
      margin-top: 2mm;
    }
    
    .grid {
      display: grid;
      gap: 1mm;
    }
    
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
    
    .field {
      border: 1px solid #ccc;
      padding: 1mm 2mm;
    }
    
    .field-label {
      font-size: 6pt;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 1mm;
    }
    
    .field-value {
      font-size: 8pt;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2mm;
    }
    
    th, td {
      border: 1px solid #ccc;
      padding: 2mm;
      text-align: left;
    }
    
    th {
      background: #f0f0f0;
      font-weight: bold;
      font-size: 7pt;
      text-transform: uppercase;
    }
    
    td {
      font-size: 7pt;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .total-section {
      background: #f9f9f9;
      margin-top: 2mm;
    }
    
    .barcode {
      text-align: center;
      margin: 3mm 0;
      font-family: 'Courier New', monospace;
      font-size: 12pt;
    }
    
    @media print {
      body { padding: 0; }
      .danfe { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="danfe">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="header-left">
        <div class="subtitle">Identificação do Emitente</div>
        <div class="title">${emitente?.name || 'Emitente'}</div>
        <div style="margin-top: 2mm; font-size: 7pt;">
          ${emitente?.address || ''}<br>
          ${emitente?.city || ''} - ${emitente?.state || ''}<br>
          ${emitente?.zip_code || ''}<br>
          <strong>CNPJ:</strong> ${emitente?.document ? formatDocument(emitente.document) : ''}
        </div>
      </div>
      
      <div class="header-center">
        <div class="text-center">
          <div class="nfe-type">DANFE</div>
          <div class="subtitle">Documento Auxiliar da Nota Fiscal Eletrônica</div>
          <div style="margin-top: 2mm;">
            <div class="subtitle">Chave de Acesso</div>
            <div class="access-key">${formatAccessKey(nfe.chave_acesso)}</div>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="subtitle">NF-e</div>
        <div class="value">${String(nfe.numero).padStart(6, '0')}</div>
        <div class="subtitle" style="margin-top: 2mm;">Série</div>
        <div class="value">${nfe.serie}</div>
        <div class="subtitle" style="margin-top: 2mm;">Data de Emissão</div>
        <div class="value">${formatDate(nfe.data_emissao)}</div>
      </div>
    </div>
    
    <!-- DESTINATÁRIO -->
    <div class="section">
      <div class="title">Destinatário / Remetente</div>
      <div class="grid grid-2" style="margin-top: 2mm;">
        <div class="field">
          <div class="field-label">Nome / Razão Social</div>
          <div class="field-value">${nfe.destinatario_nome || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">CPF / CNPJ</div>
          <div class="field-value">${nfe.destinatario_documento ? formatDocument(nfe.destinatario_documento) : ''}</div>
        </div>
      </div>
      <div class="grid grid-3" style="margin-top: 1mm;">
        <div class="field">
          <div class="field-label">Endereço</div>
          <div class="field-value">${nfe.destinatario_endereco || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Cidade</div>
          <div class="field-value">${nfe.destinatario_cidade || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">UF</div>
          <div class="field-value">${nfe.destinatario_uf || ''}</div>
        </div>
      </div>
    </div>
    
    <!-- PRODUTOS / SERVIÇOS -->
    <div class="section">
      <div class="title">Dados dos Produtos / Serviços</div>
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">Código</th>
            <th style="width: 35%;">Descrição</th>
            <th style="width: 10%;" class="text-center">NCM</th>
            <th style="width: 8%;" class="text-center">Un.</th>
            <th style="width: 10%;" class="text-right">Qtd.</th>
            <th style="width: 12%;" class="text-right">Valor Unit.</th>
            <th style="width: 15%;" class="text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.produto_codigo || ''}</td>
              <td>${item.produto_nome || ''}</td>
              <td class="text-center">${item.ncm || ''}</td>
              <td class="text-center">${item.unidade || ''}</td>
              <td class="text-right">${item.quantidade}</td>
              <td class="text-right">${formatCurrency(item.valor_unitario)}</td>
              <td class="text-right">${formatCurrency(item.valor_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- TOTAIS -->
    <div class="section total-section">
      <div class="title">Cálculo do Imposto</div>
      <div class="grid grid-4" style="margin-top: 2mm;">
        <div class="field">
          <div class="field-label">Base de Cálculo ICMS</div>
          <div class="field-value text-right">${formatCurrency(nfe.bc_icms || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do ICMS</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_icms || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do IPI</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_ipi || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor do PIS</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_pis || 0)}</div>
        </div>
      </div>
      <div class="grid grid-3" style="margin-top: 1mm;">
        <div class="field">
          <div class="field-label">Valor do COFINS</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_cofins || 0)}</div>
        </div>
        <div class="field">
          <div class="field-label">Valor Total dos Produtos</div>
          <div class="field-value text-right">${formatCurrency(nfe.valor_produtos || 0)}</div>
        </div>
        <div class="field" style="background: #e8f5e9;">
          <div class="field-label">Valor Total da Nota</div>
          <div class="field-value text-right" style="font-size: 10pt;">${formatCurrency(nfe.valor_total)}</div>
        </div>
      </div>
    </div>
    
    <!-- INFORMAÇÕES COMPLEMENTARES -->
    <div class="section">
      <div class="title">Informações Complementares</div>
      <div class="field" style="margin-top: 2mm; min-height: 15mm;">
        <div class="field-label">Observações</div>
        <div class="field-value" style="font-weight: normal;">${nfe.observacoes || 'Sem observações'}</div>
      </div>
    </div>
    
    <!-- CÓDIGO DE BARRAS -->
    <div style="padding: 3mm; text-align: center;">
      <div class="barcode">||||| |||| ||||| |||| ||||| |||| |||||</div>
      <div style="font-size: 6pt; margin-top: 1mm;">Consulta de autenticidade no Portal Nacional da NF-e</div>
      <div style="font-size: 6pt;">www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</div>
    </div>
  </div>
</body>
</html>
  `
}
