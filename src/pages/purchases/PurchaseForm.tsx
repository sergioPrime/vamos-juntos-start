import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases, type PurchaseItem } from '@/hooks/usePurchases'
import { PurchaseItemsForm } from '@/components/purchases/PurchaseItemsForm'
import { usePessoas } from '@/hooks/usePessoas'

const formSchema = z.object({
  supplier_id: z.string().optional(),
  purchase_date: z.string(),
  expected_delivery_date: z.string().optional(),
  status: z.string(),
  payment_status: z.string(),
  notes: z.string().optional(),
})

export default function PurchaseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { organization } = useAuth()
  const { createPurchase, updatePurchase } = usePurchases(organization?.id || '')
  const { pessoas } = usePessoas(organization?.id || '')
  
  const [items, setItems] = useState<PurchaseItem[]>([])
  
  const suppliers = pessoas?.filter(p => p.tipo === 'fornecedor') || []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'pending',
      payment_status: 'pending',
      purchase_date: new Date().toISOString().split('T')[0],
    },
  })

  const { register, handleSubmit } = form

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (items.length === 0) {
        toast.error('Adicione pelo menos um item ao pedido')
        return
      }

      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
      
      if (id) {
        await updatePurchase.mutateAsync({ 
          id, 
          ...data,
          subtotal,
          total_amount: subtotal,
          items 
        })
        toast.success('Pedido de compra atualizado!')
      } else {
        await createPurchase.mutateAsync({
          ...data,
          subtotal,
          total_amount: subtotal,
          items
        } as any)
        toast.success('Pedido de compra criado!')
      }
      navigate('/purchases')
    } catch (error) {
      toast.error('Erro ao salvar pedido')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {id ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
          </h1>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={createPurchase.isPending || updatePurchase.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_id">Fornecedor</Label>
                <Select
                  value={form.watch('supplier_id')}
                  onValueChange={(value) => form.setValue('supplier_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchase_date">Data do Pedido</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...register('purchase_date')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected_delivery_date">Previsão de Entrega</Label>
                <Input
                  id="expected_delivery_date"
                  type="date"
                  {...register('expected_delivery_date')}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="ordered">Pedido Feito</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="payment_status">Status do Pagamento</Label>
              <Select
                value={form.watch('payment_status')}
                onValueChange={(value) => form.setValue('payment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Observações sobre o pedido"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseItemsForm
              items={items}
              onChange={setItems}
              orgId={organization?.id || ''}
            />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
