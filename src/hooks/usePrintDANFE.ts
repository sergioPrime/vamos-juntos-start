import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function usePrintDANFE() {
  const [isPrinting, setIsPrinting] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDocument = (doc: string) => {
    if (!doc) return ''
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const generateDANFEHTML = (nfe: any, items: any[], emitente: any, destinatario: any) => {
    const itemsRows = items.map((item) => `
      <tr>
        <td>${item.codigo_produto || ''}</td>
        <td>${item.descricao || ''}</td>
        <td>${item.ncm || ''}</td>
        <td>${item.cfop || ''}</td>
        <td>${item.unidade || ''}</td>
        <td>${item.quantidade || 0}</td>
        <td>${formatCurrency(item.valor_unitario || 0)}</td>
        <td>${formatCurrency(item.valor_total || 0)}</td>
        <td>${formatCurrency(item.icms_base_calculo || 0)}</td>
        <td>${formatCurrency(item.icms_valor || 0)}</td>
        <td>${formatCurrency(item.ipi_valor || 0)}</td>
        <td>${item.icms_aliquota || 0}%</td>
      </tr>
    `).join('')

    const showReformaTributaria = (nfe.valor_total_ibs || 0) > 0 || 
                                   (nfe.valor_total_cbs || 0) > 0 || 
                                   (nfe.valor_total_is || 0) > 0

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>DANFE - NFe ${nfe.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; color: black; }
            .danfe-container { max-width: 21cm; margin: 0 auto; padding: 20px; }
            .danfe-box { border: 1px solid #000; padding: 4px; margin-bottom: 4px; }
            .danfe-label { font-size: 8px; font-weight: bold; }
            .danfe-value { font-size: 10px; }
            .danfe-header { font-size: 12px; font-weight: bold; text-align: center; }
            .grid { display: grid; gap: 4px; }
            .grid-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-4 { grid-template-columns: repeat(4, 1fr); }
            .grid-5 { grid-template-columns: repeat(5, 1fr); }
            .grid-12 { grid-template-columns: repeat(12, 1fr); }
            .col-span-3 { grid-column: span 3; }
            .col-span-4 { grid-column: span 4; }
            .col-span-5 { grid-column: span 5; }
            table { width: 100%; border-collapse: collapse; margin: 4px 0; }
            table td, table th { border: 1px solid #000; padding: 2px 4px; font-size: 8px; text-align: left; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-2xl { font-size: 24px; }
            .text-xl { font-size: 18px; }
            .text-lg { font-size: 16px; }
            .text-xs { font-size: 10px; }
            .break-all { word-break: break-all; }
            .bg-gray-100 { background-color: #f3f4f6; }
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 0; }
              .danfe-container { max-width: 100%; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="danfe-container">
            <!-- Cabeçalho -->
            <div class="grid grid-12">
              <div class="col-span-5 danfe-box">
                <div class="danfe-label">IDENTIFICAÇÃO DO EMITENTE</div>
                <div class="danfe-value font-bold">${emitente?.name || nfe.razao_social || ''}</div>
                <div class="danfe-value">${emitente?.address || nfe.endereco_emitente || ''}</div>
                <div class="danfe-value">${nfe.municipio_emitente || ''} - ${nfe.uf_emitente || ''} - CEP: ${nfe.cep_emitente || ''}</div>
                <div class="danfe-value">Fone: ${nfe.telefone_emitente || ''}</div>
              </div>
              <div class="col-span-3 danfe-box text-center">
                <div class="text-2xl font-bold">DANFE</div>
                <div class="text-xs">Documento Auxiliar da Nota Fiscal Eletrônica</div>
                <div class="text-xs" style="margin-top: 8px;">
                  <div class="danfe-label">ENTRADA/SAÍDA</div>
                  <div class="text-xl font-bold">${nfe.tipo_nf === '0' ? 'ENTRADA' : 'SAÍDA'}</div>
                </div>
                <div style="margin-top: 8px;" class="text-xs">Nº ${nfe.numero || ''} - Série ${nfe.serie || ''}</div>
              </div>
              <div class="col-span-4 danfe-box">
                <div class="danfe-label text-center">CHAVE DE ACESSO</div>
                <div class="text-center font-mono text-xs break-all">${nfe.chave_acesso || 'Aguardando autorização'}</div>
                <div style="margin-top: 8px;" class="text-center text-xs">Consulta de autenticidade no portal da SEFAZ</div>
              </div>
            </div>

            <!-- Natureza da operação -->
            <div class="danfe-box">
              <div class="danfe-label">NATUREZA DA OPERAÇÃO</div>
              <div class="danfe-value">${nfe.natureza_operacao || ''}</div>
            </div>

            <!-- Protocolo e datas -->
            <div class="grid grid-3">
              <div class="danfe-box">
                <div class="danfe-label">PROTOCOLO DE AUTORIZAÇÃO</div>
                <div class="danfe-value">${nfe.protocolo_autorizacao || 'N/A'}</div>
              </div>
              <div class="danfe-box">
                <div class="danfe-label">DATA DE EMISSÃO</div>
                <div class="danfe-value">${format(new Date(nfe.data_emissao), 'dd/MM/yyyy HH:mm:ss')}</div>
              </div>
              <div class="danfe-box">
                <div class="danfe-label">DATA SAÍDA/ENTRADA</div>
                <div class="danfe-value">${nfe.data_saida ? format(new Date(nfe.data_saida), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}</div>
              </div>
            </div>

            <!-- Destinatário -->
            <div class="danfe-box">
              <div class="danfe-header">DESTINATÁRIO/REMETENTE</div>
              <div class="grid grid-2" style="margin-top: 4px;">
                <div>
                  <div class="danfe-label">NOME/RAZÃO SOCIAL</div>
                  <div class="danfe-value">${destinatario?.nome || nfe.cliente_nome || ''}</div>
                </div>
                <div>
                  <div class="danfe-label">CPF/CNPJ</div>
                  <div class="danfe-value">${formatDocument(nfe.cliente_cpf_cnpj || '')}</div>
                </div>
                <div>
                  <div class="danfe-label">ENDEREÇO</div>
                  <div class="danfe-value">${nfe.endereco_destinatario || ''}</div>
                </div>
                <div>
                  <div class="danfe-label">MUNICÍPIO</div>
                  <div class="danfe-value">${nfe.municipio_destinatario || ''} - ${nfe.uf_destinatario || ''}</div>
                </div>
              </div>
            </div>

            <!-- Produtos -->
            <div>
              <div class="danfe-header danfe-box">DADOS DOS PRODUTOS / SERVIÇOS</div>
              <table>
                <thead>
                  <tr>
                    <th>CÓDIGO</th>
                    <th>DESCRIÇÃO</th>
                    <th>NCM</th>
                    <th>CFOP</th>
                    <th>UN</th>
                    <th>QUANT</th>
                    <th>VL UNIT</th>
                    <th>VL TOTAL</th>
                    <th>BC ICMS</th>
                    <th>VL ICMS</th>
                    <th>VL IPI</th>
                    <th>ALÍQ ICMS</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <!-- Cálculo do Imposto -->
            <div class="danfe-box">
              <div class="danfe-header">CÁLCULO DO IMPOSTO</div>
              <div class="grid grid-5" style="margin-top: 4px;">
                <div>
                  <div class="danfe-label">BASE CÁLC ICMS</div>
                  <div class="danfe-value">${formatCurrency(nfe.valor_base_calculo || 0)}</div>
                </div>
                <div>
                  <div class="danfe-label">VALOR ICMS</div>
                  <div class="danfe-value">${formatCurrency(nfe.valor_icms || 0)}</div>
                </div>
                <div>
                  <div class="danfe-label">VALOR IPI</div>
                  <div class="danfe-value">${formatCurrency(nfe.valor_ipi || 0)}</div>
                </div>
                <div>
                  <div class="danfe-label">VALOR PIS</div>
                  <div class="danfe-value">${formatCurrency(nfe.valor_pis || 0)}</div>
                </div>
                <div>
                  <div class="danfe-label">VALOR COFINS</div>
                  <div class="danfe-value">${formatCurrency(nfe.valor_cofins || 0)}</div>
                </div>
              </div>
            </div>

            ${showReformaTributaria ? `
              <!-- Reforma Tributária 2026 -->
              <div class="danfe-box">
                <div class="danfe-header">REFORMA TRIBUTÁRIA 2026</div>
                <div class="grid grid-4" style="margin-top: 4px;">
                  <div>
                    <div class="danfe-label">VALOR IBS</div>
                    <div class="danfe-value">${formatCurrency(nfe.valor_total_ibs || 0)}</div>
                  </div>
                  <div>
                    <div class="danfe-label">VALOR CBS</div>
                    <div class="danfe-value">${formatCurrency(nfe.valor_total_cbs || 0)}</div>
                  </div>
                  <div>
                    <div class="danfe-label">VALOR IS</div>
                    <div class="danfe-value">${formatCurrency(nfe.valor_total_is || 0)}</div>
                  </div>
                  <div>
                    <div class="danfe-label">TOTAL NOVOS TRIBUTOS</div>
                    <div class="danfe-value font-bold">
                      ${formatCurrency((nfe.valor_total_ibs || 0) + (nfe.valor_total_cbs || 0) + (nfe.valor_total_is || 0))}
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Totais -->
            <div class="grid grid-4">
              <div class="danfe-box">
                <div class="danfe-label">VALOR TOTAL PRODUTOS</div>
                <div class="danfe-value font-bold">${formatCurrency(nfe.valor_produtos || 0)}</div>
              </div>
              <div class="danfe-box">
                <div class="danfe-label">VALOR FRETE</div>
                <div class="danfe-value">${formatCurrency(nfe.valor_frete || 0)}</div>
              </div>
              <div class="danfe-box">
                <div class="danfe-label">VALOR DESCONTO</div>
                <div class="danfe-value">${formatCurrency(nfe.valor_desconto || 0)}</div>
              </div>
              <div class="danfe-box bg-gray-100">
                <div class="danfe-label">VALOR TOTAL DA NOTA</div>
                <div class="text-lg font-bold">${formatCurrency(nfe.valor_total || 0)}</div>
              </div>
            </div>

            <!-- Informações complementares -->
            <div class="danfe-box">
              <div class="danfe-label">INFORMAÇÕES COMPLEMENTARES</div>
              <div class="danfe-value">${nfe.informacoes_complementares || 'N/A'}</div>
            </div>

            <!-- Rodapé -->
            <div class="text-center text-xs" style="margin-top: 16px;">
              <p>Consulte pela chave de acesso em: ${nfe.uf_emitente === 'SP' ? 'https://www.nfe.fazenda.sp.gov.br' : 'https://www.nfe.fazenda.gov.br'}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const printDANFE = async (nfeId: string) => {
    try {
      setIsPrinting(true)

      // Buscar dados completos da NFe
      const { data: nfe, error: nfeError } = await supabase
        .from('nfe')
        .select(`
          *,
          pessoas:destinatario_id(nome, cpf_cnpj, email, telefone),
          companies:company_id(name, address, city, state, zip_code, document, phone, email)
        `)
        .eq('id', nfeId)
        .single()

      if (nfeError) throw nfeError

      // Buscar itens da NFe
      const { data: items, error: itemsError } = await supabase
        .from('nfe_items')
        .select('*')
        .eq('nfe_id', nfeId)
        .order('item_numero')

      if (itemsError) throw itemsError

      // Gerar HTML do DANFE
      const danfeHTML = generateDANFEHTML(
        nfe,
        items || [],
        nfe.companies,
        nfe.pessoas
      )

      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank')
      
      if (!printWindow) {
        toast.error('Bloqueador de pop-up detectado. Permita pop-ups para imprimir o DANFE.')
        return
      }

      // Escrever HTML na janela
      printWindow.document.write(danfeHTML)
      printWindow.document.close()

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }

      toast.success('DANFE gerado com sucesso!')

    } catch (error: any) {
      console.error('Erro ao gerar DANFE:', error)
      toast.error('Erro ao gerar DANFE: ' + error.message)
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printDANFE,
    isPrinting
  }
}
