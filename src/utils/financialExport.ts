import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExportData {
  headers: string[]
  rows: any[][]
  title: string
  subtitle?: string
}

export async function exportToCSV(data: ExportData): Promise<void> {
  const { headers, rows, title } = data

  // Criar conteúdo CSV
  let csvContent = title + '\n\n'
  csvContent += headers.join(';') + '\n'
  
  rows.forEach(row => {
    csvContent += row.map(cell => {
      if (typeof cell === 'number') {
        return cell.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      }
      return `"${cell || ''}"`
    }).join(';') + '\n'
  })

  // Criar blob e download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const { headers, rows, title, subtitle } = data

  // Criar HTML para Excel
  let html = `
    <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .currency { text-align: right; }
          .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">${title}</div>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => {
                  if (typeof cell === 'number') {
                    return `<td class="currency">${cell.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</td>`
                  }
                  return `<td>${cell || ''}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xls`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const { headers, rows, title, subtitle } = data

  // Criar HTML otimizado para impressão (PDF)
  const printWindow = window.open('', '', 'width=800,height=600')
  
  if (!printWindow) {
    throw new Error('Não foi possível abrir janela de impressão')
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; }
          .header { 
            text-align: center; 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px;
            color: #333;
          }
          .subtitle { 
            text-align: center;
            font-size: 12px; 
            color: #666; 
            margin-bottom: 30px; 
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 20px;
          }
          th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold; 
            padding: 12px 8px; 
            border: 1px solid #2a4d8f;
            text-align: left;
          }
          td { 
            padding: 10px 8px; 
            border: 1px solid #ddd;
          }
          .currency { text-align: right; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">${title}</div>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => {
                  if (typeof cell === 'number') {
                    return `<td class="currency">${cell.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</td>`
                  }
                  return `<td>${cell || ''}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
