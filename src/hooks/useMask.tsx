import { useState } from 'react';

export type MaskType = 'cpf' | 'cnpj' | 'phone' | 'mobile' | 'cep' | 'none';

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
  none: null,
};

export const useMask = (maskType: MaskType = 'none') => {
  const [maskedValue, setMaskedValue] = useState('');

  const applyMask = (value: string, type: MaskType = maskType): string => {
    if (type === 'none' || !maskConfigs[type]) {
      return value;
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

  const removeMask = (value: string): string => {
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
  };
};
