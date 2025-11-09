import { useState } from 'react';

export type UF = 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

interface IEMaskConfig {
  mask: string;
  length: number;
}

// Configuração de máscaras por estado
const ieMasks: Record<UF, IEMaskConfig> = {
  AC: { mask: '##.###.###/###-##', length: 13 },
  AL: { mask: '#########', length: 9 },
  AP: { mask: '#########', length: 9 },
  AM: { mask: '##.###.###-#', length: 9 },
  BA: { mask: '#######-##', length: 9 },
  CE: { mask: '########-#', length: 9 },
  DF: { mask: '###########-##', length: 13 },
  ES: { mask: '#########', length: 9 },
  GO: { mask: '##.###.###-#', length: 9 },
  MA: { mask: '#########', length: 9 },
  MT: { mask: '##########-#', length: 11 },
  MS: { mask: '#########', length: 9 },
  MG: { mask: '###.###.###/####', length: 13 },
  PA: { mask: '##-######-#', length: 9 },
  PB: { mask: '########-#', length: 9 },
  PR: { mask: '########-##', length: 10 },
  PE: { mask: '##.#.###.#######-#', length: 14 },
  PI: { mask: '#########', length: 9 },
  RJ: { mask: '##.###.##-#', length: 8 },
  RN: { mask: '##.###.###-#', length: 10 },
  RS: { mask: '###/#######', length: 10 },
  RO: { mask: '###########-#', length: 14 },
  RR: { mask: '########-#', length: 9 },
  SC: { mask: '###.###.###', length: 9 },
  SP: { mask: '###.###.###.###', length: 12 },
  SE: { mask: '#########-#', length: 9 },
  TO: { mask: '###########', length: 11 },
};

export const useInscricaoEstadual = () => {
  const [loading, setLoading] = useState(false);

  const applyIEMask = (value: string, uf: UF): string => {
    if (!uf || !ieMasks[uf]) return value;

    const numbers = value.replace(/\D/g, '');
    const config = ieMasks[uf];
    let masked = '';
    let numberIndex = 0;

    for (let i = 0; i < config.mask.length && numberIndex < numbers.length; i++) {
      if (config.mask[i] === '#') {
        masked += numbers[numberIndex];
        numberIndex++;
      } else {
        masked += config.mask[i];
      }
    }

    return masked;
  };

  const removeIEMask = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  const getIEConfig = (uf: UF) => {
    return ieMasks[uf];
  };

  // Validação de IE por UF
  const validateIE = (ie: string, uf: UF): boolean => {
    if (!ie || !uf) return false;

    const numbers = ie.replace(/\D/g, '');

    // Verificar se é "ISENTO"
    if (ie.toUpperCase() === 'ISENTO') return true;

    switch (uf) {
      case 'AC':
        return validateIE_AC(numbers);
      case 'AL':
        return validateIE_AL(numbers);
      case 'AM':
        return validateIE_AM(numbers);
      case 'BA':
        return validateIE_BA(numbers);
      case 'CE':
        return validateIE_CE(numbers);
      case 'DF':
        return validateIE_DF(numbers);
      case 'ES':
        return validateIE_ES(numbers);
      case 'GO':
        return validateIE_GO(numbers);
      case 'MA':
        return validateIE_MA(numbers);
      case 'MG':
        return validateIE_MG(numbers);
      case 'MS':
        return validateIE_MS(numbers);
      case 'MT':
        return validateIE_MT(numbers);
      case 'PA':
        return validateIE_PA(numbers);
      case 'PB':
        return validateIE_PB(numbers);
      case 'PE':
        return validateIE_PE(numbers);
      case 'PI':
        return validateIE_PI(numbers);
      case 'PR':
        return validateIE_PR(numbers);
      case 'RJ':
        return validateIE_RJ(numbers);
      case 'RN':
        return validateIE_RN(numbers);
      case 'RO':
        return validateIE_RO(numbers);
      case 'RR':
        return validateIE_RR(numbers);
      case 'RS':
        return validateIE_RS(numbers);
      case 'SC':
        return validateIE_SC(numbers);
      case 'SP':
        return validateIE_SP(numbers);
      case 'SE':
        return validateIE_SE(numbers);
      case 'TO':
        return validateIE_TO(numbers);
      default:
        return false;
    }
  };

  // Validações específicas por estado
  const validateIE_AC = (ie: string): boolean => {
    if (ie.length !== 13) return false;
    if (!ie.startsWith('01')) return false;

    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv1 = mod < 2 ? 0 : 11 - mod;

    const weights2 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 12; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod2 = sum2 % 11;
    const dv2 = mod2 < 2 ? 0 : 11 - mod2;

    return parseInt(ie[11]) === dv1 && parseInt(ie[12]) === dv2;
  };

  const validateIE_AL = (ie: string): boolean => {
    if (ie.length !== 9) return false;
    if (!['24'].includes(ie.substring(0, 2))) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const product = sum * 10;
    const dv = product % 11 === 10 ? 0 : product % 11;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_AM = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    let dv = 11 - mod;
    if (dv >= 10) dv = 0;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_BA = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 7; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 10;
    const dv1 = mod === 0 ? 0 : 10 - mod;

    const weights2 = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 8; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod2 = sum2 % 10;
    const dv2 = mod2 === 0 ? 0 : 10 - mod2;

    return parseInt(ie[7]) === dv1 && parseInt(ie[8]) === dv2;
  };

  const validateIE_CE = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_DF = (ie: string): boolean => {
    if (ie.length !== 13) return false;

    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv1 = mod <= 1 ? 0 : 11 - mod;

    const weights2 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 12; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod2 = sum2 % 11;
    const dv2 = mod2 <= 1 ? 0 : 11 - mod2;

    return parseInt(ie[11]) === dv1 && parseInt(ie[12]) === dv2;
  };

  const validateIE_ES = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod < 2 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_GO = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    let dv = 0;

    if (mod === 0) {
      dv = 0;
    } else if (mod === 1) {
      const ieNumber = parseInt(ie.substring(0, 8));
      if (ieNumber >= 10103105 && ieNumber <= 10119997) {
        dv = 1;
      } else {
        dv = 0;
      }
    } else {
      dv = 11 - mod;
    }

    return parseInt(ie[8]) === dv;
  };

  const validateIE_MA = (ie: string): boolean => {
    if (ie.length !== 9) return false;
    if (!ie.startsWith('12')) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_MG = (ie: string): boolean => {
    if (ie.length !== 13) return false;

    // Adiciona zero após o terceiro dígito
    const ieWithZero = ie.substring(0, 3) + '0' + ie.substring(3, 12);

    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      let product = parseInt(ieWithZero[i]) * weights[i];
      sum += product >= 10 ? Math.floor(product / 10) + (product % 10) : product;
    }

    const dv1 = ((Math.ceil(sum / 10) * 10) - sum) % 10;

    const weights2 = [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 12; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod = sum2 % 11;
    const dv2 = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[11]) === dv1 && parseInt(ie[12]) === dv2;
  };

  const validateIE_MS = (ie: string): boolean => {
    if (ie.length !== 9) return false;
    if (!ie.startsWith('28')) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod === 0 ? 0 : 11 - mod;
    const dvFinal = dv > 9 ? 0 : dv;

    return parseInt(ie[8]) === dvFinal;
  };

  const validateIE_MT = (ie: string): boolean => {
    if (ie.length !== 11) return false;

    const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[10]) === dv;
  };

  const validateIE_PA = (ie: string): boolean => {
    if (ie.length !== 9) return false;
    if (!ie.startsWith('15')) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_PB = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    let dv = 11 - mod;
    if (dv === 10 || dv === 11) dv = 0;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_PE = (ie: string): boolean => {
    if (ie.length !== 14) return false;

    const weights = [5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 13; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[13]) === dv;
  };

  const validateIE_PI = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_PR = (ie: string): boolean => {
    if (ie.length !== 10) return false;

    const weights = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv1 = mod <= 1 ? 0 : 11 - mod;

    const weights2 = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 9; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod2 = sum2 % 11;
    const dv2 = mod2 <= 1 ? 0 : 11 - mod2;

    return parseInt(ie[8]) === dv1 && parseInt(ie[9]) === dv2;
  };

  const validateIE_RJ = (ie: string): boolean => {
    if (ie.length !== 8) return false;

    const weights = [2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 7; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[7]) === dv;
  };

  const validateIE_RN = (ie: string): boolean => {
    if (ie.length !== 10) return false;
    if (!ie.startsWith('20')) return false;

    const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const product = sum * 10;
    const dv = product % 11 === 10 ? 0 : product % 11;

    return parseInt(ie[9]) === dv;
  };

  const validateIE_RO = (ie: string): boolean => {
    if (ie.length !== 14) return false;

    const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 13; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? mod : 11 - mod;

    return parseInt(ie[13]) === dv;
  };

  const validateIE_RR = (ie: string): boolean => {
    if (ie.length !== 9) return false;
    if (!ie.startsWith('24')) return false;

    const weights = [1, 2, 3, 4, 5, 6, 7, 8];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const dv = sum % 9;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_RS = (ie: string): boolean => {
    if (ie.length !== 10) return false;

    const weights = [2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[9]) === dv;
  };

  const validateIE_SC = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_SP = (ie: string): boolean => {
    if (ie.length !== 12) return false;

    // Primeiro dígito verificador
    const weights1 = [1, 3, 4, 5, 6, 7, 8, 10];
    let sum1 = 0;

    for (let i = 0; i < 8; i++) {
      sum1 += parseInt(ie[i]) * weights1[i];
    }

    const mod1 = sum1 % 11;
    const dv1 = mod1 === 10 ? 0 : mod1;

    // Segundo dígito verificador
    const weights2 = [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;

    for (let i = 0; i < 11; i++) {
      sum2 += parseInt(ie[i]) * weights2[i];
    }

    const mod2 = sum2 % 11;
    const dv2 = mod2 === 10 ? 0 : mod2;

    return parseInt(ie[8]) === dv1 && parseInt(ie[11]) === dv2;
  };

  const validateIE_SE = (ie: string): boolean => {
    if (ie.length !== 9) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += parseInt(ie[i]) * weights[i];
    }

    const mod = sum % 11;
    const dv = mod <= 1 ? 0 : 11 - mod;

    return parseInt(ie[8]) === dv;
  };

  const validateIE_TO = (ie: string): boolean => {
    if (ie.length !== 11) return false;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 2; i < 10; i++) {
      sum += parseInt(ie[i]) * weights[i - 2];
    }

    const mod = sum % 11;
    const dv = mod < 2 ? 0 : 11 - mod;

    return parseInt(ie[10]) === dv;
  };

  return {
    applyIEMask,
    removeIEMask,
    getIEConfig,
    validateIE,
    loading,
  };
};
