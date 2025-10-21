import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportData {
  metrics?: any;
  cashFlowData?: any[];
  revenueByCategory?: any[];
  expensesByCategory?: any[];
  entries?: any[];
  installments?: any[];
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts?: boolean;
  fileName?: string;
  organizationName?: string;
  period?: {
    start: string;
    end: string;
  };
}

// Exportar para CSV
export function exportToCSV(data: any[], fileName: string = 'relatorio') {
  if (data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  // Obter cabeçalhos
  const headers = Object.keys(data[0]);
  
  // Criar CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores que contenham vírgulas ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Exportar métricas financeiras para CSV
export function exportFinancialMetricsToCSV(data: ExportData, options: ExportOptions) {
  const { metrics, cashFlowData, revenueByCategory, expensesByCategory } = data;
  
  // Preparar dados de métricas
  const metricsData = [
    { Métrica: 'Receitas Totais', Valor: formatCurrency(metrics.totalRevenue) },
    { Métrica: 'Despesas Totais', Valor: formatCurrency(metrics.totalExpenses) },
    { Métrica: 'Lucro Líquido', Valor: formatCurrency(metrics.netProfit) },
    { Métrica: 'Margem de Lucro', Valor: `${metrics.profitMargin.toFixed(2)}%` },
    { Métrica: 'Total a Receber', Valor: formatCurrency(metrics.totalReceivables) },
    { Métrica: 'Vencidos (Receber)', Valor: formatCurrency(metrics.overdueReceivables) },
    { Métrica: 'Total a Pagar', Valor: formatCurrency(metrics.totalPayables) },
    { Métrica: 'Vencidos (Pagar)', Valor: formatCurrency(metrics.overduePayables) },
    { Métrica: 'Ticket Médio', Valor: formatCurrency(metrics.averageTicket) },
    { Métrica: 'Saldo em Caixa', Valor: formatCurrency(metrics.cashBalance) },
  ];

  exportToCSV(metricsData, options.fileName || 'metricas_financeiras');
}

// Exportar fluxo de caixa para CSV
export function exportCashFlowToCSV(data: ExportData, options: ExportOptions) {
  const { cashFlowData } = data;
  
  if (!cashFlowData || cashFlowData.length === 0) {
    throw new Error('Nenhum dado de fluxo de caixa para exportar');
  }

  const formattedData = cashFlowData.map(item => ({
    Data: item.date,
    Entradas: formatCurrency(item.inflow),
    Saídas: formatCurrency(item.outflow),
    Saldo: formatCurrency(item.balance)
  }));

  exportToCSV(formattedData, options.fileName || 'fluxo_de_caixa');
}

// Exportar categorias para CSV
export function exportCategoriestoCSV(data: ExportData, options: ExportOptions) {
  const { revenueByCategory, expensesByCategory } = data;
  
  // Receitas
  if (revenueByCategory && revenueByCategory.length > 0) {
    const revenueData = revenueByCategory.map(item => ({
      Categoria: item.name,
      Valor: formatCurrency(item.value),
      Percentual: `${((item.value / revenueByCategory.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(2)}%`
    }));
    exportToCSV(revenueData, 'receitas_por_categoria');
  }

  // Despesas
  if (expensesByCategory && expensesByCategory.length > 0) {
    const expenseData = expensesByCategory.map(item => ({
      Categoria: item.name,
      Valor: formatCurrency(item.value),
      Percentual: `${((item.value / expensesByCategory.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(2)}%`
    }));
    exportToCSV(expenseData, 'despesas_por_categoria');
  }
}

// Exportar lançamentos financeiros para CSV
export function exportFinancialEntriesToCSV(entries: any[], options: ExportOptions) {
  if (!entries || entries.length === 0) {
    throw new Error('Nenhum lançamento para exportar');
  }

  const formattedEntries = entries.map(entry => ({
    Código: entry.entry_code,
    Tipo: entry.entry_type === 'receivable' ? 'A Receber' : 'A Pagar',
    'Tipo de Pessoa': entry.person_type === 'customer' ? 'Cliente' : 'Fornecedor',
    Descrição: entry.description || '',
    Valor: formatCurrency(entry.amount),
    'Data Competência': format(new Date(entry.competence_date), 'dd/MM/yyyy', { locale: ptBR }),
    'Data Vencimento': format(new Date(entry.due_date), 'dd/MM/yyyy', { locale: ptBR }),
    Status: entry.is_settled ? 'Quitado' : 'Pendente',
    'Data Quitação': entry.settled_at ? format(new Date(entry.settled_at), 'dd/MM/yyyy', { locale: ptBR }) : ''
  }));

  exportToCSV(formattedEntries, options.fileName || 'lancamentos_financeiros');
}

// Exportar parcelas para CSV
export function exportInstallmentsToCSV(installments: any[], options: ExportOptions) {
  if (!installments || installments.length === 0) {
    throw new Error('Nenhuma parcela para exportar');
  }

  const formattedInstallments = installments.map(inst => ({
    'Número': `${inst.installment_number}/${inst.total_installments}`,
    'Data Vencimento': format(new Date(inst.due_date), 'dd/MM/yyyy', { locale: ptBR }),
    'Valor Original': formatCurrency(inst.amount),
    Multa: formatCurrency(inst.late_fee || 0),
    Juros: formatCurrency(inst.interest_amount || 0),
    Desconto: formatCurrency(inst.discount_amount || 0),
    'Valor Final': formatCurrency(inst.final_amount || inst.amount),
    Status: inst.is_settled ? 'Quitado' : 'Pendente',
    'Data Quitação': inst.settled_at ? format(new Date(inst.settled_at), 'dd/MM/yyyy', { locale: ptBR }) : '',
    'Valor Quitado': inst.settled_amount ? formatCurrency(inst.settled_amount) : ''
  }));

  exportToCSV(formattedInstallments, options.fileName || 'parcelas');
}

// Gerar relatório completo em HTML (para impressão ou PDF)
export function generateHTMLReport(data: ExportData, options: ExportOptions): string {
  const { metrics, cashFlowData, revenueByCategory, expensesByCategory } = data;
  const { organizationName, period } = options;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Financeiro - ${organizationName || 'Empresa'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: #fff;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        .header h1 { color: #2563eb; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; }
        .period {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .metric-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .metric-card.success { border-left-color: #10b981; }
        .metric-card.danger { border-left-color: #ef4444; }
        .metric-card.warning { border-left-color: #f59e0b; }
        .metric-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #111;
        }
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #2563eb;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        tr:hover { background: #f9fafb; }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .metric-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório Financeiro</h1>
        <p>${organizationName || 'Empresa'}</p>
      </div>

      ${period ? `
        <div class="period">
          <strong>Período:</strong> ${format(new Date(period.start), 'dd/MM/yyyy', { locale: ptBR })} 
          até ${format(new Date(period.end), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      ` : ''}

      <div class="section">
        <h2>Indicadores Principais</h2>
        <div class="metrics-grid">
          <div class="metric-card success">
            <div class="metric-label">Receitas Totais</div>
            <div class="metric-value">${formatCurrency(metrics.totalRevenue)}</div>
          </div>
          <div class="metric-card danger">
            <div class="metric-label">Despesas Totais</div>
            <div class="metric-value">${formatCurrency(metrics.totalExpenses)}</div>
          </div>
          <div class="metric-card ${metrics.netProfit >= 0 ? 'success' : 'danger'}">
            <div class="metric-label">Lucro Líquido</div>
            <div class="metric-value">${formatCurrency(metrics.netProfit)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Margem de Lucro</div>
            <div class="metric-value">${metrics.profitMargin.toFixed(2)}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total a Receber</div>
            <div class="metric-value">${formatCurrency(metrics.totalReceivables)}</div>
          </div>
          <div class="metric-card warning">
            <div class="metric-label">Vencidos (Receber)</div>
            <div class="metric-value">${formatCurrency(metrics.overdueReceivables)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total a Pagar</div>
            <div class="metric-value">${formatCurrency(metrics.totalPayables)}</div>
          </div>
          <div class="metric-card danger">
            <div class="metric-label">Vencidos (Pagar)</div>
            <div class="metric-value">${formatCurrency(metrics.overduePayables)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Ticket Médio</div>
            <div class="metric-value">${formatCurrency(metrics.averageTicket)}</div>
          </div>
          <div class="metric-card success">
            <div class="metric-label">Saldo em Caixa</div>
            <div class="metric-value">${formatCurrency(metrics.cashBalance)}</div>
          </div>
        </div>
      </div>

      ${cashFlowData && cashFlowData.length > 0 ? `
        <div class="section">
          <h2>Fluxo de Caixa</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${cashFlowData.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td style="color: #10b981;">${formatCurrency(item.inflow)}</td>
                  <td style="color: #ef4444;">${formatCurrency(item.outflow)}</td>
                  <td style="font-weight: bold;">${formatCurrency(item.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${revenueByCategory && revenueByCategory.length > 0 ? `
        <div class="section">
          <h2>Receitas por Categoria</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              ${revenueByCategory.map(item => {
                const total = revenueByCategory.reduce((sum, i) => sum + i.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(2);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${formatCurrency(item.value)}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${expensesByCategory && expensesByCategory.length > 0 ? `
        <div class="section">
          <h2>Despesas por Categoria</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              ${expensesByCategory.map(item => {
                const total = expensesByCategory.reduce((sum, i) => sum + i.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(2);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${formatCurrency(item.value)}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <p>Sistema ERP - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

// Imprimir relatório HTML
export function printHTMLReport(data: ExportData, options: ExportOptions) {
  const htmlContent = generateHTMLReport(data, options);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Baixar relatório como HTML
export function downloadHTMLReport(data: ExportData, options: ExportOptions) {
  const htmlContent = generateHTMLReport(data, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${options.fileName || 'relatorio'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
