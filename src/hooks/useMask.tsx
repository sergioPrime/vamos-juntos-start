import { useState } from 'react';

export type MaskType = 'cpf' | 'cnpj' | 'phone' | 'mobile' | 'cep' | 'currency' | 'cnae' | 'creditCard' | 'cnh' | 'none';

interface MaskConfig {
  mask: string;
  placeholder: string;
  maxLength: number;
}

const maskConfigs: Record<MaskType, MaskConfig | null> = {
  cpf: {
    mask: '###.###.###-##',
    placeholder: '000.000.000-00',
    maxLength: 14,
  },
  cnpj: {
    mask: '##.###.###/####-##',
    placeholder: '00.000.000/0000-00',
    maxLength: 18,
  },
  phone: {
    mask: '(##) ####-####',
    placeholder: '(00) 0000-0000',
    maxLength: 14,
  },
  mobile: {
    mask: '(##) #####-####',
    placeholder: '(00) 00000-0000',
    maxLength: 15,
  },
  cep: {
    mask: '#####-###',
    placeholder: '00000-000',
    maxLength: 9,
  },
  currency: {
    mask: 'R$ #',
    placeholder: 'R$ 0,00',
    maxLength: 19, // R$ 999.999.999,99
  },
  cnae: {
    mask: '####-#/##',
    placeholder: '0000-0/00',
    maxLength: 10,
  },
  creditCard: {
    mask: '#### #### #### ####',
    placeholder: '0000 0000 0000 0000',
    maxLength: 19,
  },
  cnh: {
    mask: '###########',
    placeholder: '00000000000',
    maxLength: 11,
  },
  none: null,
};

export const useMask = (maskType: MaskType = 'none') => {
  const [maskedValue, setMaskedValue] = useState('');
  const [cardBrand, setCardBrand] = useState<string>('');

  const detectCardBrand = (cardNumber: string): { brand: string; mask: string; maxLength: number } => {
    const numbers = cardNumber.replace(/\D/g, '');
    
    // Visa: começa com 4
    if (/^4/.test(numbers)) {
      return { brand: 'Visa', mask: '#### #### #### ####', maxLength: 19 };
    }
    
    // Mastercard: começa com 51-55 ou 2221-2720
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(numbers)) {
      return { brand: 'Mastercard', mask: '#### #### #### ####', maxLength: 19 };
    }
    
    // American Express: começa com 34 ou 37
    if (/^3[47]/.test(numbers)) {
      return { brand: 'Amex', mask: '#### ###### #####', maxLength: 17 };
    }
    
    // Diners Club: começa com 36 ou 38 ou 300-305
    if (/^(36|38|30[0-5])/.test(numbers)) {
      return { brand: 'Diners', mask: '#### ###### ####', maxLength: 16 };
    }
    
    // Discover: começa com 6011, 622126-622925, 644-649, ou 65
    if (/^(6011|65|64[4-9]|622)/.test(numbers)) {
      return { brand: 'Discover', mask: '#### #### #### ####', maxLength: 19 };
    }
    
    // Elo: começa com 4011, 4312, 4389, 4514, 4573, 5041, 5066, 5067, 509, 6277, 6362, 6363, 650, 6516, 6550
    if (/^(4011|4312|4389|4514|4573|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(numbers)) {
      return { brand: 'Elo', mask: '#### #### #### ####', maxLength: 19 };
    }
    
    // Hipercard: começa com 38 ou 60
    if (/^(38|60)/.test(numbers)) {
      return { brand: 'Hipercard', mask: '#### #### #### ####', maxLength: 19 };
    }
    
    // Default
    return { brand: 'Unknown', mask: '#### #### #### ####', maxLength: 19 };
  };

  const applyCreditCardMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers || numbers.length === 0) {
      setCardBrand('');
      return '';
    }

    const { brand, mask } = detectCardBrand(numbers);
    setCardBrand(brand);

    let masked = '';
    let numberIndex = 0;

    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
      if (mask[i] === '#') {
        masked += numbers[numberIndex];
        numberIndex++;
      } else {
        masked += mask[i];
      }
    }

    return masked;
  };

  const applyMask = (value: string, type: MaskType = maskType): string => {
    if (type === 'none' || !maskConfigs[type]) {
      return value;
    }

    // Tratamento especial para moeda
    if (type === 'currency') {
      return applyCurrencyMask(value);
    }

    // Tratamento especial para cartão de crédito
    if (type === 'creditCard') {
      return applyCreditCardMask(value);
    }

    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) {
      return '';
    }

    const config = maskConfigs[type];
    if (!config) return value;

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

  const applyCurrencyMask = (value: string): string => {
    // Remove tudo que não é número
    let numbers = value.replace(/\D/g, '');
    
    if (!numbers || numbers.length === 0) {
      return '';
    }

    // Converte para número com centavos
    const numberValue = parseInt(numbers) / 100;
    
    // Formata com separadores brasileiros
    const formatted = numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `R$ ${formatted}`;
  };

  const removeCurrencyMask = (value: string): string => {
    // Remove R$, pontos e vírgula, retorna apenas números com centavos
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '0';
    
    // Retorna o valor em centavos como string
    return numbers;
  };

  const getCurrencyValue = (maskedValue: string): number => {
    // Converte valor mascarado para número decimal
    const numbers = maskedValue.replace(/[^\d]/g, '');
    if (!numbers) return 0;
    
    return parseInt(numbers) / 100;
  };

  const removeMask = (value: string, type: MaskType = maskType): string => {
    if (type === 'currency') {
      return removeCurrencyMask(value);
    }
    return value.replace(/\D/g, '');
  };

  const handleMaskChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: MaskType = maskType,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  ) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;
    const oldLength = oldValue.length;

    // Aplicar máscara
    const newValue = applyMask(input.value, type);
    input.value = newValue;
    setMaskedValue(newValue);

    // Ajustar posição do cursor
    const newLength = newValue.length;
    const diff = newLength - oldLength;
    const newCursorPosition = cursorPosition + diff;

    // Restaurar posição do cursor
    setTimeout(() => {
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    // Chamar onChange original
    if (onChange) {
      onChange(e);
    }
  };

  const getConfig = (type: MaskType = maskType) => {
    return maskConfigs[type];
  };

  // Função para detectar automaticamente o tipo de documento (CPF ou CNPJ)
  const detectDocumentType = (value: string): MaskType => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return 'cpf';
    } else {
      return 'cnpj';
    }
  };

  // Função para detectar automaticamente o tipo de telefone
  const detectPhoneType = (value: string): MaskType => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return 'phone';
    } else {
      return 'mobile';
    }
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;

    return true;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const numbers = cnpj.replace(/\D/g, '');
    
    if (numbers.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação dos dígitos verificadores
    let length = numbers.length - 2;
    let nums = numbers.substring(0, length);
    const digits = numbers.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(nums.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    nums = numbers.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(nums.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  const validateCNAE = (cnae: string): boolean => {
    const numbers = cnae.replace(/\D/g, '');
    
    if (numbers.length !== 7) return false;

    // Extrair os dígitos
    const digits = numbers.substring(0, 6);
    const dv = parseInt(numbers.charAt(6));

    // Pesos para o cálculo: 2, 3, 4, 5, 6, 7, 8, 9
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;

    // Calcular soma ponderada
    for (let i = 0; i < 6; i++) {
      sum += parseInt(digits.charAt(i)) * weights[i];
    }

    // Calcular o dígito verificador
    const remainder = sum % 11;
    const calculatedDV = remainder < 2 ? 0 : 11 - remainder;

    return calculatedDV === dv;
  };

  // Validação de cartão de crédito usando algoritmo de Luhn
  const validateCreditCard = (cardNumber: string): boolean => {
    const numbers = cardNumber.replace(/\D/g, '');
    
    if (numbers.length < 13 || numbers.length > 19) return false;

    let sum = 0;
    let isEven = false;

    // Percorre o número de trás para frente
    for (let i = numbers.length - 1; i >= 0; i--) {
      let digit = parseInt(numbers[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateCNH = (cnh: string): boolean => {
    const numbers = cnh.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 9;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * weight;
      weight--;
    }
    
    let firstDigit = sum % 11;
    if (firstDigit >= 10) firstDigit = 0;
    
    if (firstDigit !== parseInt(numbers.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    weight = 1;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * weight;
      weight++;
    }
    
    let secondDigit = sum % 11;
    if (secondDigit >= 10) secondDigit = 0;
    
    if (secondDigit !== parseInt(numbers.charAt(10))) return false;

    return true;
  };

  const searchAddressByCEP = async (cep: string): Promise<{
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
  } | null> => {
    const cleanCEP = removeMask(cep);
    
    if (cleanCEP.length !== 8) {
      return null;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  };

  return {
    maskedValue,
    applyMask,
    removeMask,
    handleMaskChange,
    getConfig,
    detectDocumentType,
    detectPhoneType,
    validateCPF,
    validateCNPJ,
    validateCNAE,
    validateCreditCard,
    validateCNH,
    searchAddressByCEP,
    getCurrencyValue,
    cardBrand,
    detectCardBrand,
  };
};
