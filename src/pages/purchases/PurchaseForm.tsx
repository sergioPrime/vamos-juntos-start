import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePurchases } from "@/hooks/usePurchases"
import { usePessoas } from "@/hooks/usePessoas"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface PurchaseItem {
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function PurchaseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { createPurchase, updatePurchase, usePurchaseDetails, isCreating, isUpdating } = usePurchases()
  const { data: purchaseData } = usePurchaseDetails(id)
  const { pessoas } = usePessoas()
  
  const suppliers = pessoas || []
  
  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
    if (purchaseData) {
      const { purchase, items: purchaseItems } = purchaseData
      setSupplierId(purchase.supplier_id || '')
      setNotes(purchase.notes || '')
      setItems(purchaseItems || [])
    }
  }, [purchaseData])

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, codigo, descricao, preco_venda')
      .order('descricao')

    if (!error && data) {
      setProducts(data)
    }
  }

  const addItem = () => {
    setItems([...items, {
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      updateItem(index, 'product_id', productId)
      updateItem(index, 'product_name', product.descricao)
      updateItem(index, 'unit_price', product.preco_venda || 0)
      updateItem(index, 'total_price', items[index].quantity * (product.preco_venda || 0))
    }
  }

  const handleSubmit = () => {
    if (!supplierId) {
      toast({
        title: 'Erro',
        description: 'Selecione um fornecedor',
        variant: 'destructive'
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item',
        variant: 'destructive'
      })
      return
    }

    const data = {
      supplier_id: supplierId,
      notes,
      items
    }

    if (id) {
      updatePurchase({ id, ...data })
    } else {
      createPurchase(data, {
        onSuccess: () => {
          navigate('/purchases')
        }
      })
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {id ? 'Editar Pedido' : 'Novo Pedido de Compra'}
            </h1>
            <p className="text-muted-foreground">Preencha os dados do pedido</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fornecedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.razao_social || supplier.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pedido"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens do Pedido</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-24">Qtd</TableHead>
                <TableHead className="w-32">Preço Unit.</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => selectProduct(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.codigo} - {product.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min="1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum item adicionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total do Pedido</p>
              <p className="text-2xl font-bold">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
