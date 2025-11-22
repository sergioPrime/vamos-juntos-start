import { z } from 'zod'

// Esquema para item do pedido/orçamento
export const orderItemSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid('Produto inválido').optional(),
  service_id: z.string().uuid('Serviço inválido').optional(),
  product_name: z.string().min(1, 'Nome do produto obrigatório'),
  quantity: z.number()
    .positive('Quantidade deve ser maior que zero')
    .max(999999, 'Quantidade muito grande'),
  unit_price: z.number()
    .nonnegative('Preço não pode ser negativo')
    .max(999999999, 'Preço muito alto'),
  total_price: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().optional(),
  auto_purchase: z.boolean().optional(),
  item_type: z.enum(['product', 'service'])
}).refine(
  (data) => data.product_id || data.service_id,
  { message: 'Item deve ter produto ou serviço associado' }
)

// Esquema para pedido/orçamento completo
export const orderFormSchema = z.object({
  number: z.string().min(1, 'Número do pedido obrigatório'),
  type: z.enum(['order', 'quote']),
  status: z.enum(['draft', 'confirmed', 'processing', 'completed', 'cancelled', 'pending', 'accepted', 'rejected']),
  
  // Relacionamentos
  customer_id: z.string().uuid('Cliente obrigatório').optional(),
  company_id: z.string().uuid('Empresa obrigatória').optional(),
  
  // Configurações
  sales_origin: z.string().min(1, 'Origem da venda obrigatória').optional(),
  category: z.string().optional(),
  price_table: z.string().optional(),
  warehouse: z.string().optional(),
  seller: z.string().optional(),
  system_status: z.string().optional(),
  
  // Valores
  subtotal: z.number().nonnegative().optional().default(0),
  discount_amount: z.number().nonnegative().optional().default(0),
  tax_amount: z.number().nonnegative().optional().default(0),
  total_amount: z.number().nonnegative().optional().default(0),
  
  // Pagamento
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded']).optional(),
  payment_method: z.string().optional(),
  
  // Datas
  order_date: z.string().optional(),
  delivery_date: z.string().optional(),
  
  // Itens
  items: z.array(orderItemSchema)
    .min(1, 'Adicione pelo menos um item')
    .max(500, 'Máximo de 500 itens por pedido'),
  
  // Outros
  notes: z.string().max(5000, 'Observações muito longas').optional(),
  generate_service_order: z.boolean().optional()
}).refine(
  (data) => {
    // Validar que data de entrega não é no passado
    if (data.delivery_date) {
      const deliveryDate = new Date(data.delivery_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return deliveryDate >= today
    }
    return true
  },
  { message: 'Data de entrega não pode ser no passado', path: ['delivery_date'] }
)

// Type inference
export type OrderFormData = z.infer<typeof orderFormSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>

// Função de validação com tratamento de erros
export function validateOrderForm(data: unknown) {
  try {
    return {
      success: true as const,
      data: orderFormSchema.parse(data)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return {
      success: false as const,
      errors: [{ path: 'unknown', message: 'Erro de validação desconhecido' }]
    }
  }
}
