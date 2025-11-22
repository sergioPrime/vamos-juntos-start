import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePurchases, CreatePurchaseInput } from '@/hooks/usePurchases'
import { usePessoas } from '@/hooks/usePessoas'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'

interface FormData extends CreatePurchaseInput {
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function PurchaseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { createPurchase, updatePurchase, getPurchase } = usePurchases()
  const { pessoas } = usePessoas()
  const { currentOrg } = useOrganization()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_status: 'pending',
      notes: '',
      items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0, total_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!currentOrg?.id) return

      const { data, error } = await supabase
        .from('products')
        .select('id, nome, preco_venda, codigo')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('nome')

      if (!error && data) {
        setProducts(data)
      }
    }

    loadProducts()
  }, [currentOrg])

  // Load purchase if editing
  useEffect(() => {
    const loadPurchase = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const { purchase, items } = await getPurchase(id)
        
        setValue('supplier_id', purchase.supplier_id || '')
        setValue('purchase_date', purchase.purchase_date)
        setValue('status', purchase.status)
        setValue('payment_status', purchase.payment_status)
        setValue('notes', purchase.notes || '')
        
        if (items && items.length > 0) {
          setValue('items', items.map((item: any) => ({
            product_id: item.product_id || '',
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })))
        }
      } catch (error) {
        console.error('Error loading purchase:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPurchase()
  }, [id])

  // Update item total when quantity or price changes
  useEffect(() => {
    items.forEach((item, index) => {
      const total = item.quantity * item.unit_price
      if (item.total_price !== total) {
        setValue(`items.${index}.total_price`, total)
      }
    })
  }, [items, setValue])

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${index}.product_id`, productId)
      setValue(`items.${index}.product_name`, product.nome)
      setValue(`items.${index}.unit_price`, product.preco_venda || 0)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      if (id) {
        await updatePurchase({ id, ...data })
      } else {
        await createPurchase(data)
      }
      navigate('/purchases')
    } catch (error) {
      console.error('Error saving purchase:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const suppliers = pessoas?.filter(p => p.tipo_pessoa === 'fornecedor') || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/purchases')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {id ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
          </h1>
          <p className="text-muted-foreground">
            Preencha os dados do pedido de compra
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">Fornecedor *</Label>
              <Select
                value={watch('supplier_id')}
                onValueChange={(value) => setValue('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.nome_razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchase_date">Data do Pedido</Label>
              <Input
                type="date"
                {...register('purchase_date', { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status">Status Pagamento</Label>
              <Select
                value={watch('payment_status')}
                onValueChange={(value) => setValue('payment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                {...register('notes')}
                placeholder="Observações sobre o pedido"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Itens do Pedido</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  product_id: '',
                  product_name: '',
                  quantity: 1,
                  unit_price: 0,
                  total_price: 0,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg"
              >
                <div className="col-span-4">
                  <Label>Produto</Label>
                  <Select
                    value={watch(`items.${index}.product_id`)}
                    onValueChange={(value) => handleProductSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.codigo} - {product.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.quantity`, {
                      required: true,
                      min: 0.01,
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Preço Unit.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unit_price`, {
                      required: true,
                      min: 0,
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="col-span-3">
                  <Label>Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={watch(`items.${index}.total_price`).toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="col-span-1">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {totalAmount.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/purchases')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : id ? 'Atualizar' : 'Criar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  )
}
