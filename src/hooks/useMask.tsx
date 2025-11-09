import { useState } from 'react';

export type MaskType = 'cpf' | 'cnpj' | 'phone' | 'mobile' | 'cep' | 'currency' | 'none';

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
  none: null,
};

export const useMask = (maskType: MaskType = 'none') => {
  const [maskedValue, setMaskedValue] = useState('');

  const applyMask = (value: string, type: MaskType = maskType): string => {
    if (type === 'none' || !maskConfigs[type]) {
      return value;
    }

    // Tratamento especial para moeda
    if (type === 'currency') {
      return applyCurrencyMask(value);
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
    searchAddressByCEP,
    getCurrencyValue,
  };
};
