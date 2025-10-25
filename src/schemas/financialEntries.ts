import { z } from "zod"

/**
 * Schema de validação para lançamentos financeiros
 * Segue princípios de segurança e validação de dados
 */

// Helper para sanitizar strings
const sanitizeString = (str: string) => {
  return str
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove caracteres perigosos
    .substring(0, 1000) // Limita tamanho
}

// Schema para valores monetários
export const monetaryValueSchema = z
  .number()
  .positive("Valor deve ser positivo")
  .max(999999999.99, "Valor máximo excedido")

// Schema para descrição
export const descriptionSchema = z
  .string()
  .max(500, "Descrição muito longa (máximo 500 caracteres)")
  .transform(sanitizeString)
  .optional()

// Schema para datas - aceita Date ou string ISO
export const dateSchema = z.union([
  z.date(),
  z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }).transform((val) => new Date(val))
], {
  errorMap: () => ({ message: "Data inválida" })
})

// Schema principal para criação de lançamento financeiro
export const createFinancialEntrySchema = z.object({
  // IDs obrigatórios
  org_id: z.string().uuid("ID de organização inválido"),
  company_id: z.string().uuid("ID de empresa inválido"),
  person_id: z.string().uuid("ID de pessoa inválido"),
  chart_of_account_id: z.string().uuid("ID de conta contábil inválido"),
  created_by: z.string().uuid("ID de usuário inválido"),

  // Tipo de lançamento
  entry_type: z.enum(["receivable", "payable"], {
    required_error: "Tipo de lançamento é obrigatório",
  }),
  
  person_type: z.enum(["customer", "supplier"], {
    required_error: "Tipo de pessoa é obrigatório",
  }),

  // Valores monetários
  amount: z.number()
    .positive("Valor deve ser positivo")
    .max(999999999.99, "Valor máximo excedido"),

  // Datas
  competence_date: dateSchema,
  due_date: dateSchema,

  // Campos opcionais
  cost_center_id: z.string().uuid("ID de centro de custo inválido").optional(),
  payment_method_id: z.string().uuid("ID de método de pagamento inválido").optional(),
  bank_account_id: z.string().uuid("ID de conta bancária inválido").optional(),
  origin_id: z.string().uuid("ID de origem inválido").optional(),
  
  description: descriptionSchema,
  
  // Campos de liquidação
  is_settled: z.boolean().default(false),
  settled_at: dateSchema.optional(),
  settled_payment_method_id: z.string().uuid("ID de método de pagamento inválido").optional(),

  // Campos adicionais
  origin_type: z.enum(["order", "purchase", "manual"]).optional(),
  document_number: z.string()
    .max(50, "Número de documento muito longo")
    .transform(sanitizeString)
    .optional(),
  
  group_name: z.string()
    .max(100, "Nome do grupo muito longo")
    .transform(sanitizeString)
    .optional(),
  
  discount_percent: z.number()
    .min(0, "Desconto não pode ser negativo")
    .max(100, "Desconto não pode ser maior que 100%")
    .optional(),
  
  original_due_date: dateSchema.optional(),
  is_conciliated: z.boolean().default(false),
})

// Schema para atualização (todos os campos opcionais exceto ID)
export const updateFinancialEntrySchema = z.object({
  id: z.string().uuid("ID inválido"),
  company_id: z.string().uuid("ID de empresa inválido").optional(),
  person_id: z.string().uuid("ID de pessoa inválido").optional(),
  chart_of_account_id: z.string().uuid("ID de conta contábil inválido").optional(),
  cost_center_id: z.string().uuid("ID de centro de custo inválido").optional(),
  payment_method_id: z.string().uuid("ID de método de pagamento inválido").optional(),
  bank_account_id: z.string().uuid("ID de conta bancária inválido").optional(),
  
  entry_type: z.enum(["receivable", "payable"]).optional(),
  person_type: z.enum(["customer", "supplier"]).optional(),
  
  amount: z.number()
    .positive("Valor deve ser positivo")
    .max(999999999.99, "Valor máximo excedido")
    .optional(),
  
  competence_date: dateSchema.optional(),
  due_date: dateSchema.optional(),
  
  description: descriptionSchema,
  
  is_settled: z.boolean().optional(),
  settled_at: dateSchema.optional(),
  settled_payment_method_id: z.string().uuid("ID de método de pagamento inválido").optional(),
  
  origin_type: z.enum(["order", "purchase", "manual"]).optional(),
  document_number: z.string()
    .max(50, "Número de documento muito longo")
    .transform(sanitizeString)
    .optional(),
  
  group_name: z.string()
    .max(100, "Nome do grupo muito longo")
    .transform(sanitizeString)
    .optional(),
  
  discount_percent: z.number()
    .min(0, "Desconto não pode ser negativo")
    .max(100, "Desconto não pode ser maior que 100%")
    .optional(),
  
  original_due_date: dateSchema.optional(),
  is_conciliated: z.boolean().optional(),
})

// Schema para filtros de busca
export const financialEntryFiltersSchema = z.object({
  org_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  entry_type: z.enum(["receivable", "payable"]).optional(),
  is_settled: z.boolean().optional(),
  chart_of_account_id: z.string().uuid().optional(),
  cost_center_id: z.string().uuid().optional(),
  
  // Filtros de data
  competence_date_from: dateSchema.optional(),
  competence_date_to: dateSchema.optional(),
  due_date_from: dateSchema.optional(),
  due_date_to: dateSchema.optional(),
  
  // Filtros de valor
  amount_min: z.number().positive().optional(),
  amount_max: z.number().positive().optional(),
  
  // Busca de texto
  search_term: z.string()
    .max(100, "Termo de busca muito longo")
    .transform(sanitizeString)
    .optional(),
  
  // Paginação
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
})

// Tipos TypeScript derivados dos schemas
export type CreateFinancialEntryInput = z.infer<typeof createFinancialEntrySchema>
export type UpdateFinancialEntryInput = z.infer<typeof updateFinancialEntrySchema>
export type FinancialEntryFilters = z.infer<typeof financialEntryFiltersSchema>

// Função helper para validar entrada de criação
export const validateCreateEntry = (data: unknown) => {
  return createFinancialEntrySchema.parse(data)
}

// Função helper para validar entrada de atualização
export const validateUpdateEntry = (data: unknown) => {
  return updateFinancialEntrySchema.parse(data)
}

// Função helper para validar filtros
export const validateFilters = (data: unknown) => {
  return financialEntryFiltersSchema.parse(data)
}
