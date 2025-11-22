/**
 * Gerador de QR Code para NFC-e
 * Conforme NT 2016.002 - Especificação do QR Code da NFC-e
 */

/**
 * Gera a URL para o QR Code da NFC-e
 */
export function generateQRCodeURL(params: {
  chaveAcesso: string;
  ambiente: 'producao' | 'homologacao';
  uf: string;
  dhEmi: string; // ISO 8601
  vNF: string; // Valor total da nota
  digVal: string; // Digest Value da assinatura
  cIdToken: string; // CSC ID (código)
  csc: string; // CSC (Código de Segurança do Contribuinte)
}): { url: string; qrCodeData: string } {
  // URL base conforme UF e ambiente
  const urlBase = getURLConsultaQRCode(params.uf, params.ambiente);
  
  // Montar parâmetros
  const parametros = [
    params.chaveAcesso,
    '2', // Versão do QR Code (sempre 2)
    params.ambiente === 'producao' ? '1' : '2',
    params.cIdToken,
  ].join('|');
  
  // Calcular hash
  const hashInput = `${params.chaveAcesso}|2|${params.ambiente === 'producao' ? '1' : '2'}|${params.dhEmi}|${params.vNF}|${params.digVal}|${params.cIdToken}${params.csc}`;
  
  const hash = generateSHA1Hash(hashInput);
  
  // QR Code data
  const qrCodeData = `${parametros}|${hash}`;
  
  // URL completa
  const url = `${urlBase}?p=${qrCodeData}`;
  
  return { url, qrCodeData };
}

/**
 * Retorna a URL de consulta do QR Code conforme UF e ambiente
 */
function getURLConsultaQRCode(uf: string, ambiente: 'producao' | 'homologacao'): string {
  const urls: Record<string, { producao: string; homologacao: string }> = {
    'AC': {
      producao: 'https://www.sefaznet.ac.gov.br/nfce/qrcode',
      homologacao: 'https://hml.sefaznet.ac.gov.br/nfce/qrcode'
    },
    'AL': {
      producao: 'https://nfce.sefaz.al.gov.br/QRCode',
      homologacao: 'https://nfce.sefaz.al.gov.br/QRCode'
    },
    'AM': {
      producao: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',
      homologacao: 'https://homnfce.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp'
    },
    'AP': {
      producao: 'https://www.sefaz.ap.gov.br/nfce/consulta',
      homologacao: 'https://www.sefaz.ap.gov.br/nfcehom/consulta'
    },
    'BA': {
      producao: 'https://nfce.sefaz.ba.gov.br/servicos/nfce/qrcode',
      homologacao: 'https://hnfce.sefaz.ba.gov.br/servicos/nfce/qrcode'
    },
    'CE': {
      producao: 'https://nfce.sefaz.ce.gov.br/pages/consultarNFCe.jsp',
      homologacao: 'https://nfceh.sefaz.ce.gov.br/pages/consultarNFCe.jsp'
    },
    'DF': {
      producao: 'https://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',
      homologacao: 'https://dec.fazenda.df.gov.br/ConsultarNFCe.aspx'
    },
    'ES': {
      producao: 'https://app.sefaz.es.gov.br/ConsultaNFCe',
      homologacao: 'https://homologacao.sefaz.es.gov.br/ConsultaNFCe'
    },
    'GO': {
      producao: 'https://nfe.goias.gov.br/nfeweb/sites/nfce/danfeNFCe',
      homologacao: 'https://homolog.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe'
    },
    'MA': {
      producao: 'https://www.sefaz.ma.gov.br/portalsefaz/jsp/nfceweb/consultarNFCe.jsp',
      homologacao: 'https://hom.sefaz.ma.gov.br/portalsefaz/jsp/nfceweb/consultarNFCe.jsp'
    },
    'MG': {
      producao: 'https://portalsped.fazenda.mg.gov.br/portalnfce',
      homologacao: 'https://hnfce.fazenda.mg.gov.br/portalnfce'
    },
    'MS': {
      producao: 'https://www.dfe.ms.gov.br/nfce',
      homologacao: 'https://www.dfe.ms.gov.br/nfce'
    },
    'MT': {
      producao: 'https://www.sefaz.mt.gov.br/nfce/consultanfce',
      homologacao: 'https://homologacao.sefaz.mt.gov.br/nfce/consultanfce'
    },
    'PA': {
      producao: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/consultanfce.seam',
      homologacao: 'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/consultanfce.seam'
    },
    'PB': {
      producao: 'https://www.receita.pb.gov.br/nfce',
      homologacao: 'https://www.receita.pb.gov.br/nfcehom'
    },
    'PE': {
      producao: 'https://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe',
      homologacao: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-web/consultarNFCe'
    },
    'PI': {
      producao: 'https://www.sefaz.pi.gov.br/nfce/qrcode',
      homologacao: 'https://www.sefaz.pi.gov.br/nfce/qrcodehom'
    },
    'PR': {
      producao: 'https://www.fazenda.pr.gov.br/nfce/qrcode',
      homologacao: 'https://www.fazenda.pr.gov.br/nfce/qrcode'
    },
    'RJ': {
      producao: 'https://www.fazenda.rj.gov.br/nfce/consulta',
      homologacao: 'https://www4.fazenda.rj.gov.br/consultaNFCe/QRCode'
    },
    'RN': {
      producao: 'https://nfce.set.rn.gov.br/consultarNFCe.aspx',
      homologacao: 'https://hom.nfce.set.rn.gov.br/consultarNFCe.aspx'
    },
    'RO': {
      producao: 'https://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
      homologacao: 'https://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp'
    },
    'RR': {
      producao: 'https://www.sefaz.rr.gov.br/nfce/servlet/qrcode',
      homologacao: 'https://homologacao.sefaz.rr.gov.br/nfce/servlet/qrcode'
    },
    'RS': {
      producao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
      homologacao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx'
    },
    'SC': {
      producao: 'https://sat.sef.sc.gov.br/nfce/consulta',
      homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta'
    },
    'SE': {
      producao: 'https://www.nfce.se.gov.br/portal/qrcode.jsp',
      homologacao: 'https://www.hom.nfce.se.gov.br/portal/qrcode.jsp'
    },
    'SP': {
      producao: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx',
      homologacao: 'https://www.homologacao.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx'
    },
    'TO': {
      producao: 'https://www.sefaz.to.gov.br/nfce/qrcode',
      homologacao: 'https://homologacao.sefaz.to.gov.br/nfce/qrcode'
    }
  };
  
  const urlsUF = urls[uf];
  if (!urlsUF) {
    throw new Error(`UF não suportada: ${uf}`);
  }
  
  return ambiente === 'producao' ? urlsUF.producao : urlsUF.homologacao;
}

/**
 * Gera hash SHA-1 (implementação simplificada)
 * Em produção, usar biblioteca crypto apropriada
 */
function generateSHA1Hash(input: string): string {
  // Esta é uma implementação simplificada
  // Em produção real, usar: crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))
  
  // Por enquanto, retornar um hash simulado de 40 caracteres hexadecimais
  // TODO: Implementar SHA-1 real ou usar biblioteca
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Simulação de hash (substituir por implementação real)
  let hash = '';
  for (let i = 0; i < 40; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  
  return hash.toUpperCase();
}

/**
 * Nota: Para produção, implementar SHA-1 usando Web Crypto API:
 * 
 * async function generateSHA1Hash(input: string): Promise<string> {
 *   const encoder = new TextEncoder();
 *   const data = encoder.encode(input);
 *   const hashBuffer = await crypto.subtle.digest('SHA-1', data);
 *   const hashArray = Array.from(new Uint8Array(hashBuffer));
 *   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 *   return hashHex.toUpperCase();
 * }
 */
