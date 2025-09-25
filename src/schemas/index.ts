import { z } from 'zod'

// Base schemas for common validations
export const baseEntitySchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

// Document validation (CPF/CNPJ)
export const documentSchema = z.string()
  .min(11, 'Documento deve ter pelo menos 11 caracteres')
  .max(18, 'Documento deve ter no máximo 18 caracteres')
  .regex(/^[\d.-]+$/, 'Documento deve conter apenas números, pontos e hífens')

// Email validation
export const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email deve ter no máximo 255 caracteres')

// Phone validation
export const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números e símbolos permitidos')

// Product schema
export const productSchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  sku: z.string()
    .min(1, 'SKU é obrigatório')
    .max(50, 'SKU deve ter no máximo 50 caracteres'),
  price: z.number()
    .min(0, 'Preço deve ser maior ou igual a zero')
    .max(999999.99, 'Preço muito alto'),
  cost_price: z.number()
    .min(0, 'Preço de custo deve ser maior ou igual a zero')
    .max(999999.99, 'Preço de custo muito alto')
    .optional(),
  stock_quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa'),
  min_stock_level: z.number()
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo não pode ser negativo')
    .optional(),
  track_stock: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

// Customer/Person schema
export const personSchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  nome_fantasia: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  razao_social: z.string()
    .max(255, 'Razão social deve ter no máximo 255 caracteres')
    .optional(),
  documento: documentSchema,
  tipo_pessoa: z.enum(['física', 'jurídica'], {
    errorMap: () => ({ message: 'Tipo de pessoa deve ser física ou jurídica' })
  }),
  email_geral: emailSchema.optional(),
  telefone: phoneSchema.optional(),
  telefone_celular: phoneSchema.optional(),
  endereco: z.string().max(500, 'Endereço deve ter no máximo 500 caracteres').optional(),
  cidade: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres').optional(),
  uf: z.string()
    .length(2, 'UF deve ter 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'UF deve conter apenas letras maiúsculas')
    .optional(),
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000')
    .optional(),
  ativo: z.boolean().default(true),
})

// Order schema
export const orderSchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  customer_id: z.string().uuid('ID do cliente inválido').optional(),
  order_number: z.string()
    .min(1, 'Número do pedido é obrigatório')
    .max(50, 'Número do pedido deve ter no máximo 50 caracteres'),
  status: z.enum(['draft', 'confirmed', 'processing', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  order_type: z.enum(['sale', 'service', 'mixed'], {
    errorMap: () => ({ message: 'Tipo de pedido inválido' })
  }),
  subtotal: z.number()
    .min(0, 'Subtotal deve ser maior ou igual a zero'),
  total_amount: z.number()
    .min(0, 'Total deve ser maior ou igual a zero'),
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded'], {
    errorMap: () => ({ message: 'Status de pagamento inválido' })
  }),
  payment_method: z.string().max(100, 'Método de pagamento muito longo').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Order item schema
export const orderItemSchema = baseEntitySchema.extend({
  order_id: z.string().uuid('ID do pedido inválido'),
  product_id: z.string().uuid('ID do produto inválido').optional(),
  product_name: z.string()
    .min(1, 'Nome do produto é obrigatório')
    .max(255, 'Nome do produto deve ter no máximo 255 caracteres'),
  quantity: z.number()
    .min(0.01, 'Quantidade deve ser maior que zero')
    .max(999999, 'Quantidade muito alta'),
  unit_price: z.number()
    .min(0, 'Preço unitário deve ser maior ou igual a zero')
    .max(999999.99, 'Preço unitário muito alto'),
  total_price: z.number()
    .min(0, 'Total deve ser maior ou igual a zero'),
})

// Financial entry schema
export const financialEntrySchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  entry_type: z.enum(['receivable', 'payable'], {
    errorMap: () => ({ message: 'Tipo de lançamento deve ser receivable ou payable' })
  }),
  amount: z.number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999999.99, 'Valor muito alto'),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  company_id: z.string().uuid('ID da empresa inválido').optional(),
  chart_of_account_id: z.string().uuid('ID da conta contábil inválido').optional(),
  cost_center_id: z.string().uuid('ID do centro de custo inválido').optional(),
  bank_account_id: z.string().uuid('ID da conta bancária inválido').optional(),
  is_settled: z.boolean().default(false),
})

// Bank account schema
export const bankAccountSchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  bank_name: z.string()
    .min(1, 'Nome do banco é obrigatório')
    .max(100, 'Nome do banco deve ter no máximo 100 caracteres'),
  bank_code: z.string()
    .regex(/^\d{3}$/, 'Código do banco deve ter 3 dígitos')
    .optional(),
  account_number: z.string()
    .min(1, 'Número da conta é obrigatório')
    .max(20, 'Número da conta deve ter no máximo 20 caracteres'),
  account_type: z.enum(['checking', 'savings'], {
    errorMap: () => ({ message: 'Tipo de conta deve ser checking ou savings' })
  }),
  agency: z.string()
    .max(10, 'Agência deve ter no máximo 10 caracteres')
    .optional(),
  balance: z.number()
    .max(999999999.99, 'Saldo muito alto'),
  is_active: z.boolean().default(true),
})

// Stock movement schema
export const stockMovementSchema = baseEntitySchema.extend({
  org_id: z.string().uuid('ID da organização inválido'),
  product_id: z.string().uuid('ID do produto inválido'),
  quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .refine(val => val !== 0, 'Quantidade não pode ser zero'),
  movement_type: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: 'Tipo de movimento inválido' })
  }),
  reference_type: z.string().max(50, 'Tipo de referência muito longo').optional(),
  reference_id: z.string().uuid('ID de referência inválido').optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
  warehouse_id: z.string().uuid('ID do depósito inválido').optional(),
})

// Validation utility functions
export const validateCPF = (cpf: string): boolean => {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Check length
  if (cleanCPF.length !== 11) return false
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (parseInt(cleanCPF[9]) !== digit) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (parseInt(cleanCPF[10]) !== digit) return false
  
  return true
}

export const validateCNPJ = (cnpj: string): boolean => {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Check length
  if (cleanCNPJ.length !== 14) return false
  
  // Check if all digits are the same
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i]
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (parseInt(cleanCNPJ[12]) !== digit) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i]
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (parseInt(cleanCNPJ[13]) !== digit) return false
  
  return true
}

export const validateDocument = (document: string, type?: 'física' | 'jurídica'): boolean => {
  if (!document) return false
  
  const cleanDoc = document.replace(/\D/g, '')
  
  if (type === 'física' || cleanDoc.length === 11) {
    return validateCPF(document)
  } else if (type === 'jurídica' || cleanDoc.length === 14) {
    return validateCNPJ(document)
  }
  
  // If no type specified, try both
  return validateCPF(document) || validateCNPJ(document)
}