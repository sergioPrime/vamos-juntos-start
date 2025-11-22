/**
 * URLs dos webservices da SEFAZ para NFC-e por UF
 * Conforme Manual de Integração NFC-e versão 4.00
 */

export interface SEFAZEndpoints {
  nfceAutorizacao: string; // Autorização NFC-e
  nfceRetAutorizacao: string; // Retorno da autorização
  nfceInutilizacao: string; // Inutilização de numeração
  nfceConsultaProtocolo: string; // Consulta protocolo
  nfceStatusServico: string; // Status do serviço
  nfceEventoCancelamento: string; // Cancelamento (evento)
}

/**
 * Retorna os endpoints da SEFAZ conforme UF e ambiente
 */
export function getSEFAZEndpoints(uf: string, ambiente: 'producao' | 'homologacao'): SEFAZEndpoints {
  // Lista de autorizadores por UF
  const autorizadores: Record<string, string> = {
    'AM': 'SVRS', 'BA': 'SVRS', 'CE': 'SVRS', 'DF': 'SVRS',
    'ES': 'SVRS', 'GO': 'SVRS', 'MA': 'SVRS', 'MS': 'SVRS',
    'MT': 'SVRS', 'PA': 'SVRS', 'PB': 'SVRS', 'PE': 'SVRS',
    'PI': 'SVRS', 'PR': 'SVRS', 'RJ': 'SVRS', 'RN': 'SVRS',
    'RO': 'SVRS', 'RR': 'SVRS', 'RS': 'SVRS', 'SC': 'SVRS',
    'SE': 'SVRS', 'TO': 'SVRS', 'AC': 'SVRS', 'AL': 'SVRS',
    'AP': 'SVRS', 'MG': 'MG', 'SP': 'SP'
  };
  
  const autorizador = autorizadores[uf] || 'SVRS';
  
  return getEndpointsByAutorizador(autorizador, ambiente);
}

/**
 * Retorna os endpoints conforme o autorizador
 */
function getEndpointsByAutorizador(autorizador: string, ambiente: 'producao' | 'homologacao'): SEFAZEndpoints {
  const endpoints: Record<string, { producao: SEFAZEndpoints; homologacao: SEFAZEndpoints }> = {
    'SVRS': {
      producao: {
        nfceAutorizacao: 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
        nfceRetAutorizacao: 'https://nfce.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
        nfceInutilizacao: 'https://nfce.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
        nfceConsultaProtocolo: 'https://nfce.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
        nfceStatusServico: 'https://nfce.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
        nfceEventoCancelamento: 'https://nfce.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      },
      homologacao: {
        nfceAutorizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
        nfceRetAutorizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
        nfceInutilizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
        nfceConsultaProtocolo: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
        nfceStatusServico: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
        nfceEventoCancelamento: 'https://nfce-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      }
    },
    'SP': {
      producao: {
        nfceAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
        nfceRetAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
        nfceInutilizacao: 'https://nfce.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
        nfceConsultaProtocolo: 'https://nfce.fazenda.sp.gov.br/ws/nfeconsulta4.asmx',
        nfceStatusServico: 'https://nfce.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
        nfceEventoCancelamento: 'https://nfce.fazenda.sp.gov.br/ws/RecepcaoEvento4.asmx',
      },
      homologacao: {
        nfceAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
        nfceRetAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
        nfceInutilizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
        nfceConsultaProtocolo: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/nfeconsulta4.asmx',
        nfceStatusServico: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
        nfceEventoCancelamento: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/RecepcaoEvento4.asmx',
      }
    },
    'MG': {
      producao: {
        nfceAutorizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
        nfceRetAutorizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
        nfceInutilizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
        nfceConsultaProtocolo: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
        nfceStatusServico: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
        nfceEventoCancelamento: 'https://nfce.fazenda.mg.gov.br/nfce/services/RecepcaoEvento4',
      },
      homologacao: {
        nfceAutorizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
        nfceRetAutorizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
        nfceInutilizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
        nfceConsultaProtocolo: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
        nfceStatusServico: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
        nfceEventoCancelamento: 'https://hnfce.fazenda.mg.gov.br/nfce/services/RecepcaoEvento4',
      }
    }
  };
  
  const endpointsAutorizador = endpoints[autorizador];
  if (!endpointsAutorizador) {
    throw new Error(`Autorizador não suportado: ${autorizador}`);
  }
  
  return ambiente === 'producao' ? endpointsAutorizador.producao : endpointsAutorizador.homologacao;
}

/**
 * Códigos de status SEFAZ mais comuns
 */
export const STATUS_SEFAZ = {
  // Autorizados
  '100': { tipo: 'success', mensagem: 'Autorizado o uso da NF-e' },
  '150': { tipo: 'success', mensagem: 'Autorizado o uso da NF-e, autorização fora de prazo' },
  
  // Cancelamento
  '101': { tipo: 'success', mensagem: 'Cancelamento de NF-e homologado' },
  '135': { tipo: 'success', mensagem: 'Evento registrado e vinculado a NF-e' },
  
  // Rejeições comuns
  '204': { tipo: 'error', mensagem: 'Rejeição: Duplicidade de NF-e' },
  '205': { tipo: 'error', mensagem: 'Rejeição: CNPJ Emitente não habilitado' },
  '206': { tipo: 'error', mensagem: 'Rejeição: IE do emitente não informada' },
  '207': { tipo: 'error', mensagem: 'Rejeição: CNPJ destinatário não cadastrado' },
  '208': { tipo: 'error', mensagem: 'Rejeição: CPF destinatário inválido' },
  '209': { tipo: 'error', mensagem: 'Rejeição: IE destinatário inválida' },
  '210': { tipo: 'error', mensagem: 'Rejeição: UF do Emitente diverge da UF autorizadora' },
  '213': { tipo: 'error', mensagem: 'Rejeição: CNPJ-Base do Destinatário igual ao CNPJ-Base do Emitente' },
  '214': { tipo: 'error', mensagem: 'Rejeição: Tamanho da mensagem excedeu o limite estabelecido' },
  '215': { tipo: 'error', mensagem: 'Rejeição: Falha no schema XML' },
  '216': { tipo: 'error', mensagem: 'Rejeição: Chave de Acesso difere da cadastrada' },
  '217': { tipo: 'error', mensagem: 'Rejeição: NF-e não consta na base de dados da SEFAZ' },
  '218': { tipo: 'error', mensagem: 'Rejeição: NF-e já está cancelada na base de dados da SEFAZ' },
  '225': { tipo: 'error', mensagem: 'Rejeição: Falha no Schema XML da NFe' },
  '226': { tipo: 'error', mensagem: 'Rejeição: Código da UF do Emitente diverge da UF autorizadora' },
  '227': { tipo: 'error', mensagem: 'Rejeição: Erro na Chave de Acesso' },
  '228': { tipo: 'error', mensagem: 'Rejeição: Data de Emissão muito atrasada' },
  '229': { tipo: 'error', mensagem: 'Rejeição: IE do emitente não cadastrada' },
  '230': { tipo: 'error', mensagem: 'Rejeição: IE do emitente não vinculada ao CNPJ' },
  '231': { tipo: 'error', mensagem: 'Rejeição: IE do destinatário não cadastrada' },
  '232': { tipo: 'error', mensagem: 'Rejeição: IE do destinatário não vinculada ao CNPJ' },
  '233': { tipo: 'error', mensagem: 'Rejeição: Inscrição SUFRAMA inválida' },
  '234': { tipo: 'error', mensagem: 'Rejeição: Valor do ICMS difere do calculado' },
  '235': { tipo: 'error', mensagem: 'Rejeição: Valor do ICMS-ST difere do calculado' },
  '236': { tipo: 'error', mensagem: 'Rejeição: Valor do IPI difere do calculado' },
  
  // Denegações
  '301': { tipo: 'denied', mensagem: 'Uso Denegado: Irregularidade fiscal do emitente' },
  '302': { tipo: 'denied', mensagem: 'Uso Denegado: Irregularidade fiscal do destinatário' },
  '303': { tipo: 'denied', mensagem: 'Uso Denegado: Destinatário não habilitado a operar na UF' },
  
  // Processamento
  '105': { tipo: 'processing', mensagem: 'Lote em processamento' },
  '106': { tipo: 'processing', mensagem: 'Lote não localizado' },
  
  // Serviço
  '107': { tipo: 'info', mensagem: 'Serviço em Operação' },
  '108': { tipo: 'error', mensagem: 'Serviço Paralisado Momentaneamente' },
  '109': { tipo: 'error', mensagem: 'Serviço Paralisado sem Previsão' },
};

/**
 * Interpreta o código de status da SEFAZ
 */
export function interpretarStatusSEFAZ(codigo: string): {
  tipo: 'success' | 'error' | 'denied' | 'processing' | 'info';
  mensagem: string;
  autorizado: boolean;
} {
  const status = STATUS_SEFAZ[codigo as keyof typeof STATUS_SEFAZ];
  
  if (!status) {
    return {
      tipo: 'error',
      mensagem: `Código desconhecido: ${codigo}`,
      autorizado: false
    };
  }
  
  return {
    ...status,
    autorizado: status.tipo === 'success'
  };
}

/**
 * Monta envelope SOAP para comunicação com SEFAZ
 */
export function buildSOAPEnvelope(method: string, xmlContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
  <soap:Header/>
  <soap:Body>
    <nfe:${method}>
      <nfe:nfeDadosMsg>
        <![CDATA[${xmlContent}]]>
      </nfe:nfeDadosMsg>
    </nfe:${method}>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Parse resposta SOAP da SEFAZ
 */
export function parseSOAPResponse(soapXML: string): {
  status: string;
  motivo: string;
  protocolo?: string;
  chaveAcesso?: string;
  dataRecebimento?: string;
  xmlRetorno?: string;
} {
  // Implementação simplificada
  // Em produção, usar um parser XML apropriado
  
  // Extrair código de status
  const statusMatch = soapXML.match(/<cStat>(\d+)<\/cStat>/);
  const status = statusMatch ? statusMatch[1] : '999';
  
  // Extrair motivo
  const motivoMatch = soapXML.match(/<xMotivo>([^<]+)<\/xMotivo>/);
  const motivo = motivoMatch ? motivoMatch[1] : 'Erro desconhecido';
  
  // Extrair protocolo (se autorizado)
  const protocoloMatch = soapXML.match(/<nProt>(\d+)<\/nProt>/);
  const protocolo = protocoloMatch ? protocoloMatch[1] : undefined;
  
  // Extrair chave de acesso
  const chaveMatch = soapXML.match(/<chNFe>(\d{44})<\/chNFe>/);
  const chaveAcesso = chaveMatch ? chaveMatch[1] : undefined;
  
  // Extrair data de recebimento
  const dataMatch = soapXML.match(/<dhRecbto>([^<]+)<\/dhRecbto>/);
  const dataRecebimento = dataMatch ? dataMatch[1] : undefined;
  
  return {
    status,
    motivo,
    protocolo,
    chaveAcesso,
    dataRecebimento,
    xmlRetorno: soapXML
  };
}
