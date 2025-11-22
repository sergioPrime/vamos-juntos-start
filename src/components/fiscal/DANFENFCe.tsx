import { forwardRef } from 'react';
import QRCode from 'qrcode';

interface DANFENFCeProps {
  nfce: {
    numero: number;
    serie: string;
    data_emissao: string;
    chave_acesso: string;
    protocolo_autorizacao: string;
    qrcode_url: string;
    emitente_razao_social: string;
    emitente_cnpj: string;
    emitente_ie: string;
    emitente_endereco: string;
    emitente_municipio: string;
    emitente_uf: string;
    consumidor_nome?: string;
    consumidor_documento?: string;
    items: Array<{
      codigo: string;
      descricao: string;
      quantidade: number;
      valor_unitario: number;
      valor_total: number;
    }>;
    valor_produtos: number;
    valor_desconto?: number;
    valor_total: number;
    forma_pagamento: string;
  };
}

/**
 * Component for rendering DANFE NFC-e (Simplified Invoice Layout)
 * Following SEFAZ standards for thermal printer (80mm)
 */
export const DANFENFCe = forwardRef<HTMLDivElement, DANFENFCeProps>(
  ({ nfce }, ref) => {
    return (
      <div
        ref={ref}
        className="danfe-nfce"
        style={{
          width: '80mm',
          fontFamily: 'monospace',
          fontSize: '10px',
          padding: '5mm',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* Header - Emitente */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            {nfce.emitente_razao_social}
          </div>
          <div>CNPJ: {formatCNPJ(nfce.emitente_cnpj)}</div>
          <div>IE: {nfce.emitente_ie}</div>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>
            {nfce.emitente_endereco}
          </div>
          <div style={{ fontSize: '9px' }}>
            {nfce.emitente_municipio}/{nfce.emitente_uf}
          </div>
        </div>

        {/* Document Type */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA
          </div>
          <div style={{ marginTop: '4px' }}>Não permite aproveitamento de crédito de ICMS</div>
        </div>

        {/* Consumer Info (if available) */}
        {nfce.consumidor_nome && (
          <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>CONSUMIDOR</div>
            <div>{nfce.consumidor_nome}</div>
            {nfce.consumidor_documento && (
              <div>{formatDocument(nfce.consumidor_documento)}</div>
            )}
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ITENS</div>
          {nfce.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <div>
                {item.codigo} - {item.descricao}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {item.quantidade} x {formatCurrency(item.valor_unitario)}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatCurrency(item.valor_total)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Qtd. Total de Itens:</span>
            <span>{nfce.items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Valor Total dos Produtos:</span>
            <span>{formatCurrency(nfce.valor_produtos)}</span>
          </div>
          {nfce.valor_desconto && nfce.valor_desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Desconto:</span>
              <span>-{formatCurrency(nfce.valor_desconto)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>
            <span>VALOR TOTAL:</span>
            <span>{formatCurrency(nfce.valor_total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>FORMA DE PAGAMENTO</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{nfce.forma_pagamento}</span>
            <span>{formatCurrency(nfce.valor_total)}</span>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Consulte pela Chave de Acesso em:
            </div>
            <div style={{ fontSize: '9px', wordBreak: 'break-all' }}>
              https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <img 
              src={generateQRCodeDataURL(nfce.qrcode_url)} 
              alt="QR Code" 
              style={{ width: '150px', height: '150px' }}
            />
          </div>
          <div style={{ fontSize: '9px', wordBreak: 'break-all', marginTop: '8px' }}>
            {formatChaveAcesso(nfce.chave_acesso)}
          </div>
        </div>

        {/* Document Info */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '8px' }}>
          <div>NFC-e nº {nfce.numero.toString().padStart(9, '0')}</div>
          <div>Série {nfce.serie}</div>
          <div>{formatDateTime(nfce.data_emissao)}</div>
          <div style={{ marginTop: '4px' }}>
            Protocolo de Autorização: {nfce.protocolo_autorizacao}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          <div>Emitido via PrimeGestor ERP</div>
          <div style={{ marginTop: '4px' }}>
            Este documento não tem validade fiscal
          </div>
        </div>
      </div>
    );
  }
);

DANFENFCe.displayName = 'DANFENFCe';

// Helper functions
function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatDocument(doc: string): string {
  if (!doc) return '';
  if (doc.length === 11) {
    // CPF
    return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  // CNPJ
  return formatCNPJ(doc);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChaveAcesso(chave: string): string {
  if (!chave) return '';
  return chave.match(/.{1,4}/g)?.join(' ') || chave;
}

function generateQRCodeDataURL(url: string): string {
  // This would be replaced with actual QR code generation
  // Using a placeholder for now
  try {
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, url, { width: 150, margin: 1 });
    return canvas.toDataURL();
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}
