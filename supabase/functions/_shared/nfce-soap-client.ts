/**
 * NFC-e SOAP Client
 * Handles SOAP communication with SEFAZ web services
 */

export interface SoapRequest {
  method: string;
  nfeDadosMsg: string;
  url: string;
}

export interface SoapResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  retornoSefaz?: any;
}

/**
 * Build SOAP envelope for NFC-e operations
 */
export function buildSoapEnvelope(method: string, nfeDadosMsg: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/${method}">
  <soap:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${method}">
      <cUF>35</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap:Header>
  <soap:Body>
    <nfe:${method}>
      <nfe:nfeDadosMsg><![CDATA[${nfeDadosMsg}]]></nfe:nfeDadosMsg>
    </nfe:${method}>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Send SOAP request to SEFAZ
 */
export async function sendSoapRequest(request: SoapRequest): Promise<SoapResponse> {
  try {
    const soapEnvelope = buildSoapEnvelope(request.method, request.nfeDadosMsg);
    
    console.log('Sending SOAP request to:', request.url);
    console.log('Method:', request.method);
    
    const response = await fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': request.method,
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('SOAP request failed:', response.status, responseText);
      return {
        success: false,
        error: `Erro na comunicação com SEFAZ: ${response.status}`,
        statusCode: response.status,
      };
    }

    // Parse SOAP response
    const parsedResponse = parseSoapResponse(responseText, request.method);
    
    return {
      success: true,
      data: responseText,
      retornoSefaz: parsedResponse,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('SOAP request error:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido na comunicação com SEFAZ',
    };
  }
}

/**
 * Parse SOAP response from SEFAZ
 */
export function parseSoapResponse(xml: string, method: string): any {
  try {
    // Extract status code
    const cStatMatch = xml.match(/<cStat>(\d+)<\/cStat>/);
    const cStat = cStatMatch ? cStatMatch[1] : null;
    
    // Extract status message
    const xMotivoMatch = xml.match(/<xMotivo>(.*?)<\/xMotivo>/);
    const xMotivo = xMotivoMatch ? xMotivoMatch[1] : null;
    
    // Extract protocol number (for authorization)
    const nProtMatch = xml.match(/<nProt>(\d+)<\/nProt>/);
    const nProt = nProtMatch ? nProtMatch[1] : null;
    
    // Extract access key
    const chNFeMatch = xml.match(/<chNFe>(\d+)<\/chNFe>/);
    const chNFe = chNFeMatch ? chNFeMatch[1] : null;
    
    // Extract digest value (for validation)
    const digValMatch = xml.match(/<digVal>(.*?)<\/digVal>/);
    const digVal = digValMatch ? digValMatch[1] : null;
    
    // Extract authorization date/time
    const dhRecbtoMatch = xml.match(/<dhRecbto>(.*?)<\/dhRecbto>/);
    const dhRecbto = dhRecbtoMatch ? dhRecbtoMatch[1] : null;
    
    return {
      cStat,
      xMotivo,
      nProt,
      chNFe,
      digVal,
      dhRecbto,
      statusAutorizacao: getStatusDescription(cStat),
      autorizado: cStat === '100',
    };
  } catch (error) {
    console.error('Error parsing SOAP response:', error);
    return {
      cStat: '999',
      xMotivo: 'Erro ao processar resposta da SEFAZ',
      error: error.message,
    };
  }
}

/**
 * Get status description from SEFAZ code
 */
function getStatusDescription(cStat: string | null): string {
  const statusMap: Record<string, string> = {
    '100': 'Autorizado o uso da NF-e',
    '101': 'Cancelamento homologado',
    '102': 'Inutilização homologada',
    '103': 'Lote recebido com sucesso',
    '104': 'Lote processado',
    '105': 'Lote em processamento',
    '110': 'Uso Denegado',
    '135': 'Evento registrado e vinculado a NF-e',
    '204': 'Duplicidade de NF-e',
    '215': 'Rejeição: Falha no schema XML',
    '216': 'Rejeição: Chave de acesso inválida',
    '217': 'Rejeição: NF-e não consta na base de dados',
    '218': 'Rejeição: NF-e já está cancelada',
    '301': 'Uso denegado: Irregularidade fiscal do emitente',
    '302': 'Uso denegado: Irregularidade fiscal do destinatário',
    '539': 'Rejeição: CNPJ do emitente não cadastrado',
    '999': 'Erro não catalogado',
  };
  
  return statusMap[cStat || '999'] || 'Status desconhecido';
}

/**
 * Validate SOAP response
 */
export function validateSoapResponse(response: SoapResponse): boolean {
  if (!response.success) {
    return false;
  }
  
  const retorno = response.retornoSefaz;
  if (!retorno || !retorno.cStat) {
    return false;
  }
  
  // Status 100 = authorized, 101 = cancelled, 102 = inutilized, 135 = event registered
  const validStatuses = ['100', '101', '102', '135'];
  return validStatuses.includes(retorno.cStat);
}
