import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  product_name: z.string().min(1, 'Nome do produto/serviço é obrigatório'),
  item_type: z.enum(['product', 'service']),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  unit_price: z.number().nonnegative('Preço unitário não pode ser negativo'),
  total_price: z.number().nonnegative('Preço total não pode ser negativo'),
  auto_purchase: z.boolean().optional().default(false)
}).refine(
  (data) => data.product_id || data.service_id,
  { message: 'Item deve ter product_id ou service_id' }
)

export const orderFormSchema = z.object({
  order_number: z.string().optional(),
  order_type: z.enum(['sale', 'order', 'quote']),
  customer_id: z.string().uuid('Cliente é obrigatório'),
  company_id: z.string().uuid().optional(),
  sales_origin_id: z.string().uuid().optional(),
  sales_category_id: z.string().uuid().optional(),
  price_table_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  seller_id: z.string().uuid().optional(),
  system_status: z.enum(['draft', 'confirmed', 'processing', 'completed', 'cancelled']).optional(),
  total_amount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Pedido deve ter pelo menos um item'),
  generate_service_order: z.boolean().optional().default(false)
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderFormData = z.infer<typeof orderFormSchema>
