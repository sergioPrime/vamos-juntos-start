/**
 * Gerador de XML para NFC-e (Nota Fiscal de Consumidor Eletrônica)
 * Modelo 65 - Versão 4.00
 */

export interface NFCeXMLData {
  // Identificação
  numero: number;
  serie: string;
  dataEmissao: Date;
  dataSaida?: Date;
  
  // Emitente
  emitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual: string;
    inscricaoMunicipal?: string;
    cnae?: string;
    regimeTributario: string; // 1=Simples Nacional, 3=Normal
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      municipio: string;
      uf: string;
      cep: string;
    };
    telefone?: string;
    email?: string;
  };
  
  // Destinatário (opcional para NFC-e)
  destinatario?: {
    tipo: 'person' | 'company';
    nome?: string;
    documento?: string;
    email?: string;
    telefone?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      codigoMunicipio?: string;
      municipio?: string;
      uf?: string;
      cep?: string;
    };
  };
  
  // Itens
  items: Array<{
    numeroItem: number;
    codigoProduto: string;
    descricao: string;
    ncm?: string;
    cest?: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    valorDesconto?: number;
    
    // ICMS
    icms: {
      origem: string; // 0-8
      cst: string; // 00, 20, 40, 41, 60, 90, etc
      baseCalculo?: number;
      aliquota?: number;
      valor?: number;
    };
    
    // PIS
    pis: {
      cst: string;
      baseCalculo?: number;
      aliquota?: number;
      valor?: number;
    };
    
    // COFINS
    cofins: {
      cst: string;
      baseCalculo?: number;
      aliquota?: number;
      valor?: number;
    };
    
    // IPI (se aplicável)
    ipi?: {
      cst: string;
      baseCalculo?: number;
      aliquota?: number;
      valor?: number;
    };
    
    // Tributos Reforma 2026
    tributos2026?: {
      ibsUf?: { aliquota: number; valor: number };
      ibsMunicipal?: { aliquota: number; valor: number };
      cbs?: { aliquota: number; valor: number };
      is?: { aliquota: number; valor: number };
    };
  }>;
  
  // Totais
  totais: {
    valorProdutos: number;
    valorFrete?: number;
    valorSeguro?: number;
    valorDesconto?: number;
    valorOutrasDespesas?: number;
    valorTotal: number;
    
    // Tributos
    baseCalculoICMS?: number;
    valorICMS?: number;
    valorICMSST?: number;
    valorIPI?: number;
    valorPIS?: number;
    valorCOFINS?: number;
    
    // Reforma 2026
    valorTotalIBS?: number;
    valorTotalCBS?: number;
    valorTotalIS?: number;
  };
  
  // Pagamento
  pagamento: {
    forma: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
    valor: number;
    troco?: number;
  };
  
  // Informações adicionais
  informacoesComplementares?: string;
  informacoesFisco?: string;
  
  // Ambiente
  ambiente: 'producao' | 'homologacao'; // 1=Produção, 2=Homologação
  finalidade: 'normal' | 'devolucao'; // 1=Normal, 4=Devolução
  presencaComprador: 'presencial' | 'internet' | 'teleatendimento'; // 1=Presencial, 2=Internet, etc
}

/**
 * Calcula a chave de acesso da NFC-e (44 dígitos)
 * Formato: UF + AAMM + CNPJ + MOD + SERIE + NNN + TPEMIS + CNNNNNNN + DV
 */
export function calculateAccessKey(data: NFCeXMLData): string {
  const uf = data.emitente.endereco.uf;
  const ufCode = getUFCode(uf);
  
  const year = data.dataEmissao.getFullYear().toString().slice(-2);
  const month = String(data.dataEmissao.getMonth() + 1).padStart(2, '0');
  const aamm = year + month;
  
  const cnpj = data.emitente.cnpj.replace(/\D/g, '').padStart(14, '0');
  
  const modelo = '65'; // NFC-e
  
  const serie = data.serie.padStart(3, '0');
  
  const numero = String(data.numero).padStart(9, '0');
  
  const tipoEmissao = data.ambiente === 'producao' ? '1' : '1'; // 1=Normal
  
  // Código numérico aleatório (8 dígitos)
  const codigoNumerico = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  
  // Montar chave sem DV
  const chaveSemDV = ufCode + aamm + cnpj + modelo + serie + numero + tipoEmissao + codigoNumerico;
  
  // Calcular dígito verificador
  const dv = calculateMod11(chaveSemDV);
  
  return chaveSemDV + dv;
}

/**
 * Calcula o dígito verificador usando módulo 11
 */
function calculateMod11(value: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  let weightIndex = 0;
  
  // Percorre a chave de trás para frente
  for (let i = value.length - 1; i >= 0; i--) {
    const digit = parseInt(value[i]);
    const weight = weights[weightIndex % weights.length];
    sum += digit * weight;
    weightIndex++;
  }
  
  const remainder = sum % 11;
  const dv = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
  
  return String(dv);
}

/**
 * Retorna o código IBGE da UF
 */
function getUFCode(uf: string): string {
  const codes: Record<string, string> = {
    'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
    'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
    'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
    'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
    'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
    'SE': '28', 'TO': '17'
  };
  
  return codes[uf] || '00';
}

/**
 * Gera o XML da NFC-e
 */
export function generateNFCeXML(data: NFCeXMLData, chaveAcesso: string): string {
  const ambiente = data.ambiente === 'producao' ? '1' : '2';
  const finalidade = data.finalidade === 'normal' ? '1' : '4';
  const presenca = getPresencaCode(data.presencaComprador);
  
  const dataEmissaoISO = data.dataEmissao.toISOString();
  const dataSaidaISO = data.dataSaida?.toISOString() || dataEmissaoISO;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">';
  xml += `<infNFe Id="NFe${chaveAcesso}" versao="4.00">`;
  
  // IDE - Identificação
  xml += '<ide>';
  xml += `<cUF>${getUFCode(data.emitente.endereco.uf)}</cUF>`;
  xml += `<cNF>${chaveAcesso.slice(-9, -1)}</cNF>`;
  xml += '<natOp>Venda ao Consumidor</natOp>';
  xml += `<mod>65</mod>`;
  xml += `<serie>${data.serie}</serie>`;
  xml += `<nNF>${data.numero}</nNF>`;
  xml += `<dhEmi>${dataEmissaoISO}</dhEmi>`;
  xml += `<dhSaiEnt>${dataSaidaISO}</dhSaiEnt>`;
  xml += '<tpNF>1</tpNF>'; // 1=Saída
  xml += `<idDest>1</idDest>`; // 1=Operação interna
  xml += `<cMunFG>${data.emitente.endereco.codigoMunicipio}</cMunFG>`;
  xml += '<tpImp>4</tpImp>'; // 4=DANFE NFC-e
  xml += '<tpEmis>1</tpEmis>'; // 1=Emissão normal
  xml += `<cDV>${chaveAcesso.slice(-1)}</cDV>`;
  xml += `<tpAmb>${ambiente}</tpAmb>`;
  xml += `<finNFe>${finalidade}</finNFe>`;
  xml += `<indFinal>1</indFinal>`; // 1=Consumidor final
  xml += `<indPres>${presenca}</indPres>`;
  xml += '<procEmi>0</procEmi>'; // 0=Emissão com aplicativo do contribuinte
  xml += '<verProc>1.0</verProc>';
  xml += '</ide>';
  
  // EMIT - Emitente
  xml += '<emit>';
  xml += `<CNPJ>${data.emitente.cnpj.replace(/\D/g, '')}</CNPJ>`;
  xml += `<xNome>${escapeXML(data.emitente.razaoSocial)}</xNome>`;
  if (data.emitente.nomeFantasia) {
    xml += `<xFant>${escapeXML(data.emitente.nomeFantasia)}</xFant>`;
  }
  xml += '<enderEmit>';
  xml += `<xLgr>${escapeXML(data.emitente.endereco.logradouro)}</xLgr>`;
  xml += `<nro>${escapeXML(data.emitente.endereco.numero)}</nro>`;
  if (data.emitente.endereco.complemento) {
    xml += `<xCpl>${escapeXML(data.emitente.endereco.complemento)}</xCpl>`;
  }
  xml += `<xBairro>${escapeXML(data.emitente.endereco.bairro)}</xBairro>`;
  xml += `<cMun>${data.emitente.endereco.codigoMunicipio}</cMun>`;
  xml += `<xMun>${escapeXML(data.emitente.endereco.municipio)}</xMun>`;
  xml += `<UF>${data.emitente.endereco.uf}</UF>`;
  xml += `<CEP>${data.emitente.endereco.cep.replace(/\D/g, '')}</CEP>`;
  xml += '<cPais>1058</cPais>'; // Brasil
  xml += '<xPais>Brasil</xPais>';
  if (data.emitente.telefone) {
    xml += `<fone>${data.emitente.telefone.replace(/\D/g, '')}</fone>`;
  }
  xml += '</enderEmit>';
  xml += `<IE>${data.emitente.inscricaoEstadual.replace(/\D/g, '')}</IE>`;
  if (data.emitente.inscricaoMunicipal) {
    xml += `<IM>${data.emitente.inscricaoMunicipal}</IM>`;
  }
  if (data.emitente.cnae) {
    xml += `<CNAE>${data.emitente.cnae}</CNAE>`;
  }
  xml += `<CRT>${data.emitente.regimeTributario}</CRT>`;
  xml += '</emit>';
  
  // DEST - Destinatário (opcional)
  if (data.destinatario && data.destinatario.documento) {
    xml += '<dest>';
    
    const docLimpo = data.destinatario.documento.replace(/\D/g, '');
    if (docLimpo.length === 11) {
      xml += `<CPF>${docLimpo}</CPF>`;
    } else if (docLimpo.length === 14) {
      xml += `<CNPJ>${docLimpo}</CNPJ>`;
    }
    
    if (data.destinatario.nome) {
      xml += `<xNome>${escapeXML(data.destinatario.nome)}</xNome>`;
    }
    
    if (data.destinatario.endereco) {
      xml += '<enderDest>';
      if (data.destinatario.endereco.logradouro) {
        xml += `<xLgr>${escapeXML(data.destinatario.endereco.logradouro)}</xLgr>`;
      }
      if (data.destinatario.endereco.numero) {
        xml += `<nro>${escapeXML(data.destinatario.endereco.numero)}</nro>`;
      }
      if (data.destinatario.endereco.bairro) {
        xml += `<xBairro>${escapeXML(data.destinatario.endereco.bairro)}</xBairro>`;
      }
      if (data.destinatario.endereco.codigoMunicipio) {
        xml += `<cMun>${data.destinatario.endereco.codigoMunicipio}</cMun>`;
      }
      if (data.destinatario.endereco.municipio) {
        xml += `<xMun>${escapeXML(data.destinatario.endereco.municipio)}</xMun>`;
      }
      if (data.destinatario.endereco.uf) {
        xml += `<UF>${data.destinatario.endereco.uf}</UF>`;
      }
      if (data.destinatario.endereco.cep) {
        xml += `<CEP>${data.destinatario.endereco.cep.replace(/\D/g, '')}</CEP>`;
      }
      xml += '<cPais>1058</cPais>';
      xml += '<xPais>Brasil</xPais>';
      xml += '</enderDest>';
    }
    
    xml += '<indIEDest>9</indIEDest>'; // 9=Não Contribuinte
    
    if (data.destinatario.email) {
      xml += `<email>${escapeXML(data.destinatario.email)}</email>`;
    }
    
    xml += '</dest>';
  }
  
  // DET - Detalhamento dos produtos
  data.items.forEach((item) => {
    xml += `<det nItem="${item.numeroItem}">`;
    
    // PROD - Produto
    xml += '<prod>';
    xml += `<cProd>${escapeXML(item.codigoProduto)}</cProd>`;
    xml += `<cEAN>SEM GTIN</cEAN>`;
    xml += `<xProd>${escapeXML(item.descricao)}</xProd>`;
    if (item.ncm) {
      xml += `<NCM>${item.ncm}</NCM>`;
    }
    if (item.cest) {
      xml += `<CEST>${item.cest}</CEST>`;
    }
    xml += `<CFOP>${item.cfop}</CFOP>`;
    xml += `<uCom>${escapeXML(item.unidade)}</uCom>`;
    xml += `<qCom>${formatDecimal(item.quantidade, 4)}</qCom>`;
    xml += `<vUnCom>${formatDecimal(item.valorUnitario, 10)}</vUnCom>`;
    xml += `<vProd>${formatDecimal(item.valorTotal, 2)}</vProd>`;
    xml += `<cEANTrib>SEM GTIN</cEANTrib>`;
    xml += `<uTrib>${escapeXML(item.unidade)}</uTrib>`;
    xml += `<qTrib>${formatDecimal(item.quantidade, 4)}</qTrib>`;
    xml += `<vUnTrib>${formatDecimal(item.valorUnitario, 10)}</vUnTrib>`;
    if (item.valorDesconto && item.valorDesconto > 0) {
      xml += `<vDesc>${formatDecimal(item.valorDesconto, 2)}</vDesc>`;
    }
    xml += '<indTot>1</indTot>'; // 1=Valor compõe o total da NF-e
    xml += '</prod>';
    
    // IMPOSTO - Tributos
    xml += '<imposto>';
    
    // ICMS
    xml += '<ICMS>';
    xml += `<ICMS${item.icms.cst}>`;
    xml += `<orig>${item.icms.origem}</orig>`;
    xml += `<CST>${item.icms.cst}</CST>`;
    if (item.icms.baseCalculo !== undefined) {
      xml += `<vBC>${formatDecimal(item.icms.baseCalculo, 2)}</vBC>`;
    }
    if (item.icms.aliquota !== undefined) {
      xml += `<pICMS>${formatDecimal(item.icms.aliquota, 2)}</pICMS>`;
    }
    if (item.icms.valor !== undefined) {
      xml += `<vICMS>${formatDecimal(item.icms.valor, 2)}</vICMS>`;
    }
    xml += `</ICMS${item.icms.cst}>`;
    xml += '</ICMS>';
    
    // PIS
    xml += '<PIS>';
    xml += `<PISAliq>`;
    xml += `<CST>${item.pis.cst}</CST>`;
    if (item.pis.baseCalculo !== undefined) {
      xml += `<vBC>${formatDecimal(item.pis.baseCalculo, 2)}</vBC>`;
    }
    if (item.pis.aliquota !== undefined) {
      xml += `<pPIS>${formatDecimal(item.pis.aliquota, 4)}</pPIS>`;
    }
    if (item.pis.valor !== undefined) {
      xml += `<vPIS>${formatDecimal(item.pis.valor, 2)}</vPIS>`;
    }
    xml += '</PISAliq>';
    xml += '</PIS>';
    
    // COFINS
    xml += '<COFINS>';
    xml += `<COFINSAliq>`;
    xml += `<CST>${item.cofins.cst}</CST>`;
    if (item.cofins.baseCalculo !== undefined) {
      xml += `<vBC>${formatDecimal(item.cofins.baseCalculo, 2)}</vBC>`;
    }
    if (item.cofins.aliquota !== undefined) {
      xml += `<pCOFINS>${formatDecimal(item.cofins.aliquota, 4)}</pCOFINS>`;
    }
    if (item.cofins.valor !== undefined) {
      xml += `<vCOFINS>${formatDecimal(item.cofins.valor, 2)}</vCOFINS>`;
    }
    xml += '</COFINSAliq>';
    xml += '</COFINS>';
    
    xml += '</imposto>';
    
    xml += '</det>';
  });
  
  // TOTAL - Totais
  xml += '<total>';
  xml += '<ICMSTot>';
  xml += `<vBC>${formatDecimal(data.totais.baseCalculoICMS || 0, 2)}</vBC>`;
  xml += `<vICMS>${formatDecimal(data.totais.valorICMS || 0, 2)}</vICMS>`;
  xml += `<vICMSDeson>0.00</vICMSDeson>`;
  xml += `<vFCP>0.00</vFCP>`;
  xml += `<vBCST>0.00</vBCST>`;
  xml += `<vST>0.00</vST>`;
  xml += `<vFCPST>0.00</vFCPST>`;
  xml += `<vFCPSTRet>0.00</vFCPSTRet>`;
  xml += `<vProd>${formatDecimal(data.totais.valorProdutos, 2)}</vProd>`;
  xml += `<vFrete>${formatDecimal(data.totais.valorFrete || 0, 2)}</vFrete>`;
  xml += `<vSeg>${formatDecimal(data.totais.valorSeguro || 0, 2)}</vSeg>`;
  xml += `<vDesc>${formatDecimal(data.totais.valorDesconto || 0, 2)}</vDesc>`;
  xml += `<vII>0.00</vII>`;
  xml += `<vIPI>${formatDecimal(data.totais.valorIPI || 0, 2)}</vIPI>`;
  xml += `<vIPIDevol>0.00</vIPIDevol>`;
  xml += `<vPIS>${formatDecimal(data.totais.valorPIS || 0, 2)}</vPIS>`;
  xml += `<vCOFINS>${formatDecimal(data.totais.valorCOFINS || 0, 2)}</vCOFINS>`;
  xml += `<vOutro>${formatDecimal(data.totais.valorOutrasDespesas || 0, 2)}</vOutro>`;
  xml += `<vNF>${formatDecimal(data.totais.valorTotal, 2)}</vNF>`;
  xml += `<vTotTrib>0.00</vTotTrib>`;
  xml += '</ICMSTot>';
  xml += '</total>';
  
  // TRANSP - Transporte (não aplicável para NFC-e)
  xml += '<transp>';
  xml += '<modFrete>9</modFrete>'; // 9=Sem frete
  xml += '</transp>';
  
  // PAG - Pagamento
  xml += '<pag>';
  xml += '<detPag>';
  xml += `<tPag>${getFormaPagamentoCode(data.pagamento.forma)}</tPag>`;
  xml += `<vPag>${formatDecimal(data.pagamento.valor, 2)}</vPag>`;
  xml += '</detPag>';
  if (data.pagamento.troco && data.pagamento.troco > 0) {
    xml += `<vTroco>${formatDecimal(data.pagamento.troco, 2)}</vTroco>`;
  }
  xml += '</pag>';
  
  // INFADIC - Informações adicionais
  if (data.informacoesComplementares || data.informacoesFisco) {
    xml += '<infAdic>';
    if (data.informacoesFisco) {
      xml += `<infAdFisco>${escapeXML(data.informacoesFisco)}</infAdFisco>`;
    }
    if (data.informacoesComplementares) {
      xml += `<infCpl>${escapeXML(data.informacoesComplementares)}</infCpl>`;
    }
    xml += '</infAdic>';
  }
  
  xml += '</infNFe>';
  xml += '</NFe>';
  
  return xml;
}

/**
 * Escapa caracteres especiais para XML
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formata número decimal para XML
 */
function formatDecimal(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/**
 * Retorna o código de presença do comprador
 */
function getPresencaCode(presenca: string): string {
  const codes: Record<string, string> = {
    'presencial': '1',
    'internet': '2',
    'teleatendimento': '3',
  };
  return codes[presenca] || '1';
}

/**
 * Retorna o código da forma de pagamento
 */
function getFormaPagamentoCode(forma: string): string {
  const codes: Record<string, string> = {
    'dinheiro': '01',
    'cheque': '02',
    'cartao_credito': '03',
    'cartao_debito': '04',
    'credito_loja': '05',
    'vale_alimentacao': '10',
    'vale_refeicao': '11',
    'vale_presente': '12',
    'vale_combustivel': '13',
    'pix': '17',
    'transferencia': '18',
    'cashback': '19',
    'sem_pagamento': '90',
    'outros': '99',
  };
  return codes[forma] || '01';
}
