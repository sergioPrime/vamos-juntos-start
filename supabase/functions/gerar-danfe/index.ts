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
    const { nfeId } = await req.json()

    if (!nfeId) {
      return new Response(
        JSON.stringify({ error: 'NFe ID é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados da NFe
    const { data: nfe, error: nfeError } = await supabase
      .from('fiscal_nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NFe não encontrada')
    }

    // Buscar itens da NFe
    const { data: items, error: itemsError } = await supabase
      .from('fiscal_nfe_items')
      .select('*')
      .eq('nfe_id', nfeId)

    if (itemsError) {
      throw new Error('Erro ao buscar itens da NFe')
    }

    // Buscar dados da empresa emitente
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', nfe.company_id)
      .single()

    if (companyError || !company) {
      throw new Error('Empresa não encontrada')
    }

    // Gerar QR Code para a NFe
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nfe.chave_acesso || '')}`

    // Gerar HTML do DANFE
    const danfeHtml = generateDANFEHtml(nfe, items || [], company, qrCodeUrl)

    return new Response(
      JSON.stringify({ 
        success: true,
        html: danfeHtml,
        nfeNumber: nfe.numero,
        serie: nfe.serie
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error generating DANFE:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateDANFEHtml(nfe: any, items: any[], company: any, qrCodeUrl: string): string {
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

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DANFE - NFe ${nfe.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 8pt; 
      padding: 10px;
    }
    .danfe-container {
      width: 210mm;
      margin: 0 auto;
      border: 2px solid #000;
    }
    .header {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      border-bottom: 2px solid #000;
    }
    .header-section {
      padding: 5px;
      border-right: 1px solid #000;
    }
    .header-section:last-child {
      border-right: none;
    }
    .title {
      font-weight: bold;
      font-size: 12pt;
      text-align: center;
      padding: 5px;
      background-color: #f0f0f0;
    }
    .section-title {
      font-weight: bold;
      font-size: 7pt;
      background-color: #e0e0e0;
      padding: 2px 5px;
      border-bottom: 1px solid #000;
    }
    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      border-bottom: 1px solid #ccc;
    }
    .info-field {
      padding: 3px 5px;
      border-right: 1px solid #ccc;
    }
    .info-field:last-child {
      border-right: none;
    }
    .info-label {
      font-size: 6pt;
      color: #666;
    }
    .info-value {
      font-size: 8pt;
      font-weight: bold;
    }
    .chave-acesso {
      text-align: center;
      padding: 10px;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 2px;
      border-bottom: 2px solid #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #e0e0e0;
      font-weight: bold;
      font-size: 7pt;
      padding: 3px;
      border: 1px solid #000;
    }
    td {
      font-size: 7pt;
      padding: 3px;
      border: 1px solid #ccc;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-top: 2px solid #000;
    }
    .total-field {
      padding: 5px;
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .total-field:nth-child(3n) {
      border-right: none;
    }
    .qr-code {
      text-align: center;
      padding: 10px;
    }
    @media print {
      body { padding: 0; }
      .danfe-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="danfe-container">
    <!-- Cabeçalho -->
    <div class="header">
      <div class="header-section">
        <div style="text-align: center; padding: 10px;">
          <strong>LOGO</strong>
        </div>
      </div>
      <div class="header-section">
        <div style="text-align: center;">
          <strong style="font-size: 14pt;">DANFE</strong><br>
          <span style="font-size: 9pt;">Documento Auxiliar da Nota Fiscal Eletrônica</span>
        </div>
        <div style="margin-top: 10px; font-size: 7pt;">
          <strong>0 - ENTRADA</strong><br>
          <strong>1 - SAÍDA</strong><br>
          <div style="border: 2px solid #000; padding: 5px; text-align: center; margin: 5px 0;">
            <strong style="font-size: 16pt;">${nfe.natureza_operacao === 'VENDA' ? '1' : '0'}</strong>
          </div>
        </div>
      </div>
      <div class="header-section">
        <div style="text-align: center;">
          <strong>NFe Nº ${nfe.numero}</strong><br>
          <strong>Série ${nfe.serie}</strong><br>
          <img src="${qrCodeUrl}" alt="QR Code" style="margin-top: 10px;">
        </div>
      </div>
    </div>

    <!-- Chave de Acesso -->
    <div class="chave-acesso">
      CHAVE DE ACESSO: ${nfe.chave_acesso || 'AGUARDANDO AUTORIZAÇÃO'}
    </div>

    <!-- Dados do Emitente -->
    <div class="section-title">EMITENTE</div>
    <div class="info-row">
      <div class="info-field" style="grid-column: span 3;">
        <div class="info-label">RAZÃO SOCIAL / NOME</div>
        <div class="info-value">${company.name}</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-field" style="grid-column: span 2;">
        <div class="info-label">ENDEREÇO</div>
        <div class="info-value">${company.address || ''}</div>
      </div>
      <div class="info-field">
        <div class="info-label">BAIRRO/DISTRITO</div>
        <div class="info-value">-</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-field">
        <div class="info-label">CEP</div>
        <div class="info-value">${company.zip_code || ''}</div>
      </div>
      <div class="info-field">
        <div class="info-label">MUNICÍPIO</div>
        <div class="info-value">${company.city || ''}</div>
      </div>
      <div class="info-field">
        <div class="info-label">UF</div>
        <div class="info-value">${company.state || ''}</div>
      </div>
      <div class="info-field">
        <div class="info-label">FONE/FAX</div>
        <div class="info-value">${company.phone || ''}</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-field">
        <div class="info-label">CNPJ</div>
        <div class="info-value">${formatDocument(company.document || '')}</div>
      </div>
      <div class="info-field">
        <div class="info-label">INSCRIÇÃO ESTADUAL</div>
        <div class="info-value">-</div>
      </div>
      <div class="info-field">
        <div class="info-label">IE DO SUBSTITUTO TRIBUTÁRIO</div>
        <div class="info-value">-</div>
      </div>
    </div>

    <!-- Dados do Destinatário -->
    <div class="section-title">DESTINATÁRIO / REMETENTE</div>
    <div class="info-row">
      <div class="info-field" style="grid-column: span 3;">
        <div class="info-label">NOME / RAZÃO SOCIAL</div>
        <div class="info-value">${nfe.destinatario_nome || ''}</div>
      </div>
      <div class="info-field">
        <div class="info-label">CNPJ/CPF</div>
        <div class="info-value">${formatDocument(nfe.destinatario_documento || '')}</div>
      </div>
      <div class="info-field">
        <div class="info-label">DATA DE EMISSÃO</div>
        <div class="info-value">${formatDate(nfe.data_emissao)}</div>
      </div>
    </div>

    <!-- Produtos e Serviços -->
    <div class="section-title">DADOS DOS PRODUTOS / SERVIÇOS</div>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">CÓDIGO</th>
          <th>DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
          <th style="width: 50px;">NCM/SH</th>
          <th style="width: 40px;">CST</th>
          <th style="width: 40px;">CFOP</th>
          <th style="width: 50px;">UN</th>
          <th style="width: 60px;">QUANT.</th>
          <th style="width: 70px;">VALOR UNIT.</th>
          <th style="width: 80px;">VALOR TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.codigo_produto || ''}</td>
            <td>${item.descricao_produto}</td>
            <td>${item.ncm || ''}</td>
            <td>${item.cst || ''}</td>
            <td>${item.cfop || ''}</td>
            <td>${item.unidade_comercial || 'UN'}</td>
            <td style="text-align: right;">${item.quantidade_comercial}</td>
            <td style="text-align: right;">${formatCurrency(item.valor_unitario_comercial)}</td>
            <td style="text-align: right;">${formatCurrency(item.valor_total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Cálculo do Imposto -->
    <div class="section-title">CÁLCULO DO IMPOSTO</div>
    <div class="totals-grid">
      <div class="total-field">
        <div class="info-label">BASE DE CÁLCULO DO ICMS</div>
        <div class="info-value">${formatCurrency(nfe.base_calculo_icms || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO ICMS</div>
        <div class="info-value">${formatCurrency(nfe.valor_icms || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">BASE DE CÁLCULO DO ICMS ST</div>
        <div class="info-value">${formatCurrency(0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO ICMS SUBSTITUIÇÃO</div>
        <div class="info-value">${formatCurrency(0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR TOTAL DOS PRODUTOS</div>
        <div class="info-value">${formatCurrency(nfe.valor_total_produtos || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO FRETE</div>
        <div class="info-value">${formatCurrency(nfe.valor_frete || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO SEGURO</div>
        <div class="info-value">${formatCurrency(nfe.valor_seguro || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">DESCONTO</div>
        <div class="info-value">${formatCurrency(nfe.valor_desconto || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">OUTRAS DESPESAS</div>
        <div class="info-value">${formatCurrency(nfe.valor_outras_despesas || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO IPI</div>
        <div class="info-value">${formatCurrency(nfe.valor_ipi || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DO PIS</div>
        <div class="info-value">${formatCurrency(nfe.valor_pis || 0)}</div>
      </div>
      <div class="total-field">
        <div class="info-label">VALOR DA COFINS</div>
        <div class="info-value">${formatCurrency(nfe.valor_cofins || 0)}</div>
      </div>
      <div class="total-field" style="grid-column: span 3; background-color: #f0f0f0;">
        <div class="info-label">VALOR TOTAL DA NOTA</div>
        <div class="info-value" style="font-size: 14pt;">${formatCurrency(nfe.valor_total_nota || 0)}</div>
      </div>
    </div>

    <!-- Informações Adicionais -->
    <div class="section-title">DADOS ADICIONAIS</div>
    <div style="padding: 10px; min-height: 60px; border-bottom: 1px solid #000;">
      <strong>INFORMAÇÕES COMPLEMENTARES:</strong><br>
      ${nfe.informacoes_complementares || 'Nenhuma informação adicional'}
    </div>

    <!-- Rodapé -->
    <div style="text-align: center; padding: 5px; font-size: 7pt;">
      Documento emitido pelo sistema PrimeGestor ERP
    </div>
  </div>
</body>
</html>
  `
}
