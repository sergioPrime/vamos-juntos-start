/**
 * Tratamento centralizado de erros de estoque
 */

export type StockErrorType =
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRODUCT'
  | 'INVALID_WAREHOUSE'
  | 'INVALID_LOT'
  | 'TRANSACTION_FAILED'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'UNKNOWN'

export interface StockError {
  type: StockErrorType
  message: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Cria um erro estruturado de estoque
 */
export function createStockError(
  type: StockErrorType,
  message: string,
  details?: Record<string, any>
): StockError {
  return {
    type,
    message,
    details,
    timestamp: new Date().toISOString()
  }
}

/**
 * Extrai mensagem de erro amigável do erro do Supabase
 */
export function extractSupabaseError(error: any): StockError {
  // Erro de validação de RPC
  if (error?.message) {
    const msg = error.message.toLowerCase()
    
    if (msg.includes('estoque insuficiente')) {
      return createStockError(
        'INSUFFICIENT_STOCK',
        'Estoque insuficiente para realizar esta operação',
        { originalError: error.message }
      )
    }
    
    if (msg.includes('produto') && msg.includes('inativo')) {
      return createStockError(
        'INVALID_PRODUCT',
        'Este produto está inativo e não pode ser movimentado',
        { originalError: error.message }
      )
    }
    
    if (msg.includes('armazém')) {
      return createStockError(
        'INVALID_WAREHOUSE',
        'Armazém inválido ou não encontrado',
        { originalError: error.message }
      )
    }
    
    if (msg.includes('lote')) {
      return createStockError(
        'INVALID_LOT',
        'Lote inválido ou não encontrado',
        { originalError: error.message }
      )
    }
    
    if (msg.includes('permiss')) {
      return createStockError(
        'PERMISSION_DENIED',
        'Você não tem permissão para realizar esta operação',
        { originalError: error.message }
      )
    }
  }

  // Erro de transação
  if (error?.code === '23505') {
    return createStockError(
      'TRANSACTION_FAILED',
      'Erro de duplicação: registro já existe',
      { code: error.code }
    )
  }

  if (error?.code === '23503') {
    return createStockError(
      'VALIDATION_ERROR',
      'Referência inválida: registro relacionado não encontrado',
      { code: error.code }
    )
  }

  // Not found
  if (error?.code === 'PGRST116') {
    return createStockError(
      'NOT_FOUND',
      'Registro não encontrado',
      { code: error.code }
    )
  }

  // Erro genérico
  return createStockError(
    'UNKNOWN',
    error?.message || 'Erro desconhecido ao processar operação',
    { error }
  )
}

/**
 * Converte erro em mensagem para toast
 */
export function getErrorToastMessage(error: StockError): string {
  const messages: Record<StockErrorType, string> = {
    INSUFFICIENT_STOCK: '❌ Estoque insuficiente',
    INVALID_QUANTITY: '❌ Quantidade inválida',
    INVALID_PRODUCT: '❌ Produto inválido',
    INVALID_WAREHOUSE: '❌ Armazém inválido',
    INVALID_LOT: '❌ Lote inválido',
    TRANSACTION_FAILED: '❌ Falha na transação',
    VALIDATION_ERROR: '❌ Erro de validação',
    PERMISSION_DENIED: '🔒 Sem permissão',
    NOT_FOUND: '🔍 Não encontrado',
    UNKNOWN: '⚠️ Erro desconhecido'
  }

  return `${messages[error.type]}: ${error.message}`
}

/**
 * Registra erro no console com contexto
 */
export function logStockError(error: StockError, context?: string): void {
  console.error(
    `[STOCK ERROR${context ? ` - ${context}` : ''}]`,
    {
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    }
  )
}

/**
 * Wrapper para operações de estoque com error handling
 */
export async function withStockErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: StockError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (err) {
    const error = extractSupabaseError(err)
    logStockError(error, context)
    return { data: null, error }
  }
}

/**
 * Verifica se erro é recuperável (pode tentar novamente)
 */
export function isRecoverableError(error: StockError): boolean {
  const recoverableTypes: StockErrorType[] = [
    'TRANSACTION_FAILED',
    'UNKNOWN'
  ]
  return recoverableTypes.includes(error.type)
}

/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const stockError = extractSupabaseError(error)
      
      // Não retenta se erro não é recuperável
      if (!isRecoverableError(stockError)) {
        throw error
      }
      
      // Aguarda antes de tentar novamente (backoff exponencial)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
