import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function usePrintDANFE() {
  const [isPrinting, setIsPrinting] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  const generateDANFEHTML = (nfe: any, items: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>DANFE - NFe ${nfe.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 10px; padding: 10mm; }
            .danfe { border: 2px solid #000; }
            .header { display: flex; border-bottom: 2px solid #000; }
            .logo { width: 25%; padding: 5px; border-right: 1px solid #000; }
            .emitente { width: 50%; padding: 5px; border-right: 1px solid #000; }
            .nfe-info { width: 25%; padding: 5px; text-align: center; }
            .title { font-size: 12px; font-weight: bold; margin-bottom: 3px; }
            .section { border-bottom: 1px solid #000; padding: 5px; }
            .row { display: flex; }
            .col { flex: 1; padding: 2px; border-right: 1px solid #000; }
            .col:last-child { border-right: none; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 3px; text-align: left; font-size: 9px; }
            th { background: #f0f0f0; font-weight: bold; }
            .barcode { text-align: center; padding: 10px; font-size: 12px; letter-spacing: 2px; }
            .small { font-size: 8px; }
            @media print {
              body { padding: 0; }
              .danfe { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="danfe">
            <!-- Cabeçalho -->
            <div class="header">
              <div class="logo">
                <div class="title">LOGOTIPO</div>
              </div>
              <div class="emitente">
                <div class="title">${nfe.razao_social_emitente || 'Empresa Emitente'}</div>
                <div>${nfe.endereco_emitente || 'Endereço do Emitente'}</div>
                <div>CNPJ: ${formatDocument(nfe.cnpj_emitente || '')}</div>
              </div>
              <div class="nfe-info">
                <div class="title" style="font-size: 16px;">DANFE</div>
                <div class="small">Documento Auxiliar da Nota Fiscal Eletrônica</div>
                <div style="margin-top: 10px;">
                  <div class="title">Nº ${nfe.numero}</div>
                  <div class="title">SÉRIE ${nfe.serie}</div>
                </div>
              </div>
            </div>

            <!-- Destinatário/Remetente -->
            <div class="section">
              <div class="title">DESTINATÁRIO/REMETENTE</div>
              <div class="row">
                <div class="col" style="flex: 3;">
                  <div class="small">Nome/Razão Social</div>
                  <div>${nfe.razao_social_destinatario || 'Cliente'}</div>
                </div>
                <div class="col">
                  <div class="small">CNPJ/CPF</div>
                  <div>${formatDocument(nfe.documento_destinatario || '')}</div>
                </div>
              </div>
              <div class="row">
                <div class="col" style="flex: 2;">
                  <div class="small">Endereço</div>
                  <div>${nfe.endereco_destinatario || ''}</div>
                </div>
                <div class="col">
                  <div class="small">Município</div>
                  <div>${nfe.municipio_destinatario || ''}</div>
                </div>
                <div class="col">
                  <div class="small">UF</div>
                  <div>${nfe.uf_destinatario || ''}</div>
                </div>
              </div>
            </div>

            <!-- Dados da NFe -->
            <div class="section">
              <div class="row">
                <div class="col">
                  <div class="small">Data de Emissão</div>
                  <div>${new Date(nfe.data_emissao).toLocaleString('pt-BR')}</div>
                </div>
                <div class="col">
                  <div class="small">Natureza da Operação</div>
                  <div>${nfe.natureza_operacao || 'Venda de Mercadoria'}</div>
                </div>
                <div class="col">
                  <div class="small">Protocolo</div>
                  <div>${nfe.protocolo_autorizacao || ''}</div>
                </div>
              </div>
            </div>

            <!-- Produtos/Serviços -->
            <div class="section">
              <div class="title">DADOS DOS PRODUTOS/SERVIÇOS</div>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>NCM</th>
                    <th>CFOP</th>
                    <th>Unid.</th>
                    <th>Qtde.</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.codigo_produto || ''}</td>
                      <td>${item.descricao || ''}</td>
                      <td>${item.ncm || ''}</td>
                      <td>${item.cfop || ''}</td>
                      <td>${item.unidade || 'UN'}</td>
                      <td>${item.quantidade || 0}</td>
                      <td>${formatCurrency(item.valor_unitario || 0)}</td>
                      <td>${formatCurrency(item.valor_total || 0)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Totais -->
            <div class="section">
              <div class="row">
                <div class="col">
                  <div class="small">Base de Cálculo ICMS</div>
                  <div>${formatCurrency(nfe.base_calculo_icms || 0)}</div>
                </div>
                <div class="col">
                  <div class="small">Valor ICMS</div>
                  <div>${formatCurrency(nfe.valor_icms || 0)}</div>
                </div>
                <div class="col">
                  <div class="small">Valor Total Produtos</div>
                  <div>${formatCurrency(nfe.valor_produtos || 0)}</div>
                </div>
                <div class="col">
                  <div class="small">Valor do Frete</div>
                  <div>${formatCurrency(nfe.valor_frete || 0)}</div>
                </div>
                <div class="col">
                  <div class="small">Valor Total da NFe</div>
                  <div class="title">${formatCurrency(nfe.valor_total || 0)}</div>
                </div>
              </div>
            </div>

            <!-- Chave de Acesso -->
            <div class="barcode">
              <div class="small">Chave de Acesso</div>
              <div style="font-family: monospace;">${nfe.chave_acesso || ''}</div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const printDANFE = async (nfeId: string) => {
    setIsPrinting(true)
    try {
      // Buscar dados da NFe
      const { data: nfe, error: nfeError } = await supabase
        .from('nfe')
        .select('*')
        .eq('id', nfeId)
        .single()

      if (nfeError) throw nfeError

      // Por enquanto, usar array vazio de itens
      // TODO: Implementar busca de itens quando a tabela for criada
      const items: any[] = []

      // Gerar HTML do DANFE
      const html = generateDANFEHTML(nfe, items)

      // Abrir em nova janela e imprimir
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        toast.error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.')
      }
    } catch (error) {
      console.error('Erro ao imprimir DANFE:', error)
      toast.error('Erro ao gerar DANFE para impressão')
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printDANFE,
    isPrinting
  }
}
