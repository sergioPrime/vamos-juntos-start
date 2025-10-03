/**
 * Validação de segurança de senha
 * Implementação alternativa para proteção de senhas (plano Free)
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

// Lista de senhas comuns mais usadas (top 100 mais vazadas)
const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon',
  '123123', 'baseball', 'iloveyou', 'trustno1', '1234567890',
  'sunshine', 'master', 'welcome', 'shadow', 'ashley',
  'football', 'jesus', 'michael', 'ninja', 'mustang',
  'password1', '000000', 'admin', 'letmein', 'monkey',
  'abc123', '696969', 'superman', 'qwertyuiop', 'senha',
  'admin123', '1q2w3e4r', 'passw0rd', 'senha123', '123qwe'
]

// Padrões sequenciais comuns
const SEQUENTIAL_PATTERNS = [
  '012345', '123456', '234567', '345678', '456789',
  'abcdef', 'qwerty', 'asdfgh', 'zxcvbn'
]

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  
  // 1. Comprimento mínimo (8 caracteres)
  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres')
  }
  
  // 2. Deve conter pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }
  
  // 3. Deve conter pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }
  
  // 4. Deve conter pelo menos um número
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }
  
  // 5. Deve conter pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&* etc.)')
  }
  
  // 6. Verificar se não é uma senha comum
  const lowerPassword = password.toLowerCase()
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    errors.push('Esta senha é muito comum e insegura. Escolha uma senha diferente')
  }
  
  // 7. Verificar padrões sequenciais
  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      errors.push('A senha não deve conter sequências óbvias (123456, qwerty, etc.)')
      break
    }
  }
  
  // 8. Verificar repetição de caracteres
  if (/(.)\1{2,}/.test(password)) {
    errors.push('A senha não deve conter muitos caracteres repetidos')
  }
  
  // Calcular força da senha
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  
  if (errors.length === 0) {
    const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password)
    const hasNumbers = /[0-9]/.test(password)
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    const isLongEnough = password.length >= 12
    
    const strengthScore = [
      hasUpperAndLower,
      hasNumbers,
      hasSpecialChars,
      isLongEnough
    ].filter(Boolean).length
    
    if (strengthScore >= 4) {
      strength = 'strong'
    } else if (strengthScore >= 3) {
      strength = 'medium'
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
  }
}

export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Fraca'
    case 'medium':
      return 'Média'
    case 'strong':
      return 'Forte'
  }
}
