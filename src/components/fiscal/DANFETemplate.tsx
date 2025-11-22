import { format } from 'date-fns'

interface DANFETemplateProps {
  nfe: any
  items: any[]
  emitente: any
  destinatario: any
}

export function DANFETemplate({ nfe, items, emitente, destinatario }: DANFETemplateProps) {
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

  return (
    <div className="danfe-container bg-white text-black p-8 max-w-[21cm] mx-auto">
      <style>{`
        @media print {
          body { margin: 0; }
          .danfe-container { max-width: 100%; }
        }
        .danfe-box { border: 1px solid #000; padding: 4px; }
        .danfe-label { font-size: 8px; font-weight: bold; }
        .danfe-value { font-size: 10px; }
        .danfe-header { font-size: 12px; font-weight: bold; text-align: center; }
        table { width: 100%; border-collapse: collapse; }
        table td, table th { border: 1px solid #000; padding: 2px 4px; font-size: 8px; }
      `}</style>

      {/* Cabeçalho */}
      <div className="grid grid-cols-12 gap-1 mb-2">
        {/* Identificação do emitente */}
        <div className="col-span-5 danfe-box">
          <div className="danfe-label">IDENTIFICAÇÃO DO EMITENTE</div>
          <div className="danfe-value font-bold">{emitente?.name || nfe.razao_social}</div>
          <div className="danfe-value">{emitente?.address || nfe.endereco_emitente}</div>
          <div className="danfe-value">
            {nfe.municipio_emitente} - {nfe.uf_emitente} - CEP: {nfe.cep_emitente}
          </div>
          <div className="danfe-value">Fone: {nfe.telefone_emitente}</div>
        </div>

        {/* DANFE */}
        <div className="col-span-3 danfe-box text-center">
          <div className="text-2xl font-bold">DANFE</div>
          <div className="text-xs">Documento Auxiliar da Nota Fiscal Eletrônica</div>
          <div className="text-xs mt-2">
            <div className="danfe-label">ENTRADA/SAÍDA</div>
            <div className="text-xl font-bold">{nfe.tipo_nf === '0' ? 'ENTRADA' : 'SAÍDA'}</div>
          </div>
          <div className="mt-2 text-xs">
            Nº {nfe.numero} - Série {nfe.serie}
          </div>
        </div>

        {/* Código de barras e chave */}
        <div className="col-span-4 danfe-box">
          <div className="danfe-label text-center">CHAVE DE ACESSO</div>
          <div className="text-center font-mono text-xs break-all">{nfe.chave_acesso || 'Aguardando autorização'}</div>
          <div className="mt-2 text-center text-xs">
            Consulta de autenticidade no portal da SEFAZ
          </div>
        </div>
      </div>

      {/* Natureza da operação */}
      <div className="danfe-box mb-2">
        <div className="danfe-label">NATUREZA DA OPERAÇÃO</div>
        <div className="danfe-value">{nfe.natureza_operacao}</div>
      </div>

      {/* Protocolo e datas */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="danfe-box">
          <div className="danfe-label">PROTOCOLO DE AUTORIZAÇÃO</div>
          <div className="danfe-value">{nfe.protocolo_autorizacao || 'N/A'}</div>
        </div>
        <div className="danfe-box">
          <div className="danfe-label">DATA DE EMISSÃO</div>
          <div className="danfe-value">{format(new Date(nfe.data_emissao), 'dd/MM/yyyy HH:mm:ss')}</div>
        </div>
        <div className="danfe-box">
          <div className="danfe-label">DATA SAÍDA/ENTRADA</div>
          <div className="danfe-value">{nfe.data_saida ? format(new Date(nfe.data_saida), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}</div>
        </div>
      </div>

      {/* Destinatário */}
      <div className="danfe-box mb-2">
        <div className="danfe-header">DESTINATÁRIO/REMETENTE</div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="danfe-label">NOME/RAZÃO SOCIAL</div>
            <div className="danfe-value">{destinatario?.nome || nfe.cliente_nome}</div>
          </div>
          <div>
            <div className="danfe-label">CPF/CNPJ</div>
            <div className="danfe-value">{formatDocument(nfe.cliente_cpf_cnpj)}</div>
          </div>
          <div>
            <div className="danfe-label">ENDEREÇO</div>
            <div className="danfe-value">{nfe.endereco_destinatario}</div>
          </div>
          <div>
            <div className="danfe-label">MUNICÍPIO</div>
            <div className="danfe-value">{nfe.municipio_destinatario} - {nfe.uf_destinatario}</div>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="mb-2">
        <div className="danfe-header danfe-box">DADOS DOS PRODUTOS / SERVIÇOS</div>
        <table>
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>DESCRIÇÃO</th>
              <th>NCM</th>
              <th>CFOP</th>
              <th>UN</th>
              <th>QUANT</th>
              <th>VALOR UNIT</th>
              <th>VALOR TOTAL</th>
              <th>BC ICMS</th>
              <th>VALOR ICMS</th>
              <th>VALOR IPI</th>
              <th>ALÍQ ICMS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.codigo_produto}</td>
                <td>{item.descricao}</td>
                <td>{item.ncm}</td>
                <td>{item.cfop}</td>
                <td>{item.unidade}</td>
                <td>{item.quantidade}</td>
                <td>{formatCurrency(item.valor_unitario)}</td>
                <td>{formatCurrency(item.valor_total)}</td>
                <td>{formatCurrency(item.icms_base_calculo || 0)}</td>
                <td>{formatCurrency(item.icms_valor || 0)}</td>
                <td>{formatCurrency(item.ipi_valor || 0)}</td>
                <td>{item.icms_aliquota || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cálculo do Imposto */}
      <div className="danfe-box mb-2">
        <div className="danfe-header">CÁLCULO DO IMPOSTO</div>
        <div className="grid grid-cols-5 gap-1 mt-1">
          <div>
            <div className="danfe-label">BASE CÁLC ICMS</div>
            <div className="danfe-value">{formatCurrency(nfe.valor_base_calculo || 0)}</div>
          </div>
          <div>
            <div className="danfe-label">VALOR ICMS</div>
            <div className="danfe-value">{formatCurrency(nfe.valor_icms || 0)}</div>
          </div>
          <div>
            <div className="danfe-label">VALOR IPI</div>
            <div className="danfe-value">{formatCurrency(nfe.valor_ipi || 0)}</div>
          </div>
          <div>
            <div className="danfe-label">VALOR PIS</div>
            <div className="danfe-value">{formatCurrency(nfe.valor_pis || 0)}</div>
          </div>
          <div>
            <div className="danfe-label">VALOR COFINS</div>
            <div className="danfe-value">{formatCurrency(nfe.valor_cofins || 0)}</div>
          </div>
        </div>
      </div>

      {/* Reforma Tributária 2026 */}
      {(nfe.valor_total_ibs > 0 || nfe.valor_total_cbs > 0 || nfe.valor_total_is > 0) && (
        <div className="danfe-box mb-2">
          <div className="danfe-header">REFORMA TRIBUTÁRIA 2026</div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <div>
              <div className="danfe-label">VALOR IBS</div>
              <div className="danfe-value">{formatCurrency(nfe.valor_total_ibs || 0)}</div>
            </div>
            <div>
              <div className="danfe-label">VALOR CBS</div>
              <div className="danfe-value">{formatCurrency(nfe.valor_total_cbs || 0)}</div>
            </div>
            <div>
              <div className="danfe-label">VALOR IS</div>
              <div className="danfe-value">{formatCurrency(nfe.valor_total_is || 0)}</div>
            </div>
            <div>
              <div className="danfe-label">TOTAL NOVOS TRIBUTOS</div>
              <div className="danfe-value font-bold">
                {formatCurrency((nfe.valor_total_ibs || 0) + (nfe.valor_total_cbs || 0) + (nfe.valor_total_is || 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Totais */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        <div className="danfe-box">
          <div className="danfe-label">VALOR TOTAL PRODUTOS</div>
          <div className="danfe-value font-bold">{formatCurrency(nfe.valor_produtos)}</div>
        </div>
        <div className="danfe-box">
          <div className="danfe-label">VALOR FRETE</div>
          <div className="danfe-value">{formatCurrency(nfe.valor_frete || 0)}</div>
        </div>
        <div className="danfe-box">
          <div className="danfe-label">VALOR DESCONTO</div>
          <div className="danfe-value">{formatCurrency(nfe.valor_desconto || 0)}</div>
        </div>
        <div className="danfe-box bg-gray-100">
          <div className="danfe-label">VALOR TOTAL DA NOTA</div>
          <div className="text-lg font-bold">{formatCurrency(nfe.valor_total)}</div>
        </div>
      </div>

      {/* Informações complementares */}
      <div className="danfe-box mb-2">
        <div className="danfe-label">INFORMAÇÕES COMPLEMENTARES</div>
        <div className="danfe-value">{nfe.informacoes_complementares || 'N/A'}</div>
      </div>

      {/* Rodapé */}
      <div className="text-center text-xs mt-4">
        <p>Consulte pela chave de acesso em: {nfe.uf_emitente === 'SP' ? 'https://www.nfe.fazenda.sp.gov.br' : 'https://www.nfe.fazenda.gov.br'}</p>
      </div>
    </div>
  )
}
