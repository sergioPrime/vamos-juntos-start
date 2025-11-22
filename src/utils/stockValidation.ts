/**
 * Validação de dados de estoque
 * Funções puras para validar operações antes de enviar ao banco
 */

export interface StockValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProductStockData {
  id: string
  name: string
  stock_quantity: number
  min_stock_level?: number
  max_stock_level?: number
  active: boolean
  has_lot_control?: boolean
  has_serial_control?: boolean
}

/**
 * Valida quantidade de estoque
 */
export function validateQuantity(quantity: number): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (!Number.isFinite(quantity)) {
    result.valid = false
    result.errors.push('Quantidade inválida')
    return result
  }

  if (quantity <= 0) {
    result.valid = false
    result.errors.push('Quantidade deve ser maior que zero')
  }

  if (quantity > 999999) {
    result.valid = false
    result.errors.push('Quantidade excede limite máximo (999.999)')
  }

  if (!Number.isInteger(quantity)) {
    result.warnings.push('Quantidade contém decimais e será arredondada')
  }

  return result
}

/**
 * Valida se há estoque suficiente
 */
export function validateAvailableStock(
  requested: number,
  available: number,
  productName: string
): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (requested > available) {
    result.valid = false
    result.errors.push(
      `Estoque insuficiente para "${productName}". Disponível: ${available}, Solicitado: ${requested}`
    )
  }

  return result
}

/**
 * Valida produto para operação de estoque
 */
export function validateProductForStock(product: ProductStockData): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (!product.active) {
    result.valid = false
    result.errors.push(`Produto "${product.name}" está inativo`)
  }

  if (product.min_stock_level && product.stock_quantity < product.min_stock_level) {
    result.warnings.push(
      `Produto "${product.name}" está abaixo do estoque mínimo (${product.min_stock_level})`
    )
  }

  if (product.max_stock_level && product.stock_quantity > product.max_stock_level) {
    result.warnings.push(
      `Produto "${product.name}" está acima do estoque máximo (${product.max_stock_level})`
    )
  }

  return result
}

/**
 * Valida transferência de estoque
 */
export function validateStockTransfer(
  quantity: number,
  fromWarehouse: string,
  toWarehouse: string,
  availableStock: number
): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Valida quantidade
  const qtyValidation = validateQuantity(quantity)
  result.errors.push(...qtyValidation.errors)
  result.warnings.push(...qtyValidation.warnings)
  if (!qtyValidation.valid) result.valid = false

  // Valida armazéns diferentes
  if (fromWarehouse === toWarehouse) {
    result.valid = false
    result.errors.push('Armazém de origem e destino não podem ser iguais')
  }

  // Valida disponibilidade
  if (quantity > availableStock) {
    result.valid = false
    result.errors.push(
      `Estoque insuficiente no armazém de origem. Disponível: ${availableStock}`
    )
  }

  return result
}

/**
 * Valida saída de estoque
 */
export function validateStockExit(
  quantity: number,
  availableStock: number,
  productName: string,
  exitType: string
): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Valida quantidade
  const qtyValidation = validateQuantity(quantity)
  result.errors.push(...qtyValidation.errors)
  result.warnings.push(...qtyValidation.warnings)
  if (!qtyValidation.valid) result.valid = false

  // Valida tipo de saída
  const validExitTypes = ['sale', 'loss', 'adjustment', 'return', 'transfer', 'production']
  if (!validExitTypes.includes(exitType)) {
    result.valid = false
    result.errors.push(`Tipo de saída inválido: ${exitType}`)
  }

  // Valida disponibilidade
  const stockValidation = validateAvailableStock(quantity, availableStock, productName)
  result.errors.push(...stockValidation.errors)
  if (!stockValidation.valid) result.valid = false

  return result
}

/**
 * Valida entrada de estoque
 */
export function validateStockEntry(
  quantity: number,
  unitCost?: number,
  totalCost?: number
): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Valida quantidade
  const qtyValidation = validateQuantity(quantity)
  result.errors.push(...qtyValidation.errors)
  result.warnings.push(...qtyValidation.warnings)
  if (!qtyValidation.valid) result.valid = false

  // Valida custos se fornecidos
  if (unitCost !== undefined) {
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      result.valid = false
      result.errors.push('Custo unitário inválido')
    }

    if (totalCost !== undefined) {
      const calculatedTotal = quantity * unitCost
      if (Math.abs(calculatedTotal - totalCost) > 0.01) {
        result.warnings.push(
          `Custo total informado (${totalCost}) difere do calculado (${calculatedTotal})`
        )
      }
    }
  }

  return result
}

/**
 * Valida múltiplos itens de uma vez (para pedidos)
 */
export function validateOrderItems(
  items: Array<{ productId: string; quantity: number; availableStock: number; productName: string }>
): StockValidationResult {
  const result: StockValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  if (!items || items.length === 0) {
    result.valid = false
    result.errors.push('Nenhum item fornecido para validação')
    return result
  }

  items.forEach((item, index) => {
    const itemValidation = validateAvailableStock(
      item.quantity,
      item.availableStock,
      item.productName
    )
    
    if (!itemValidation.valid) {
      result.valid = false
      result.errors.push(`Item ${index + 1}: ${itemValidation.errors.join(', ')}`)
    }
    
    result.warnings.push(...itemValidation.warnings.map(w => `Item ${index + 1}: ${w}`))
  })

  return result
}

/**
 * Combina múltiplos resultados de validação
 */
export function combineValidationResults(
  ...results: StockValidationResult[]
): StockValidationResult {
  return {
    valid: results.every(r => r.valid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings)
  }
}
