import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus } from 'lucide-react'
import { ProductSelector } from '@/components/ui/product-selector'

export interface PurchaseItem {
  id?: string
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface PurchaseItemsFormProps {
  items: PurchaseItem[]
  onChange: (items: PurchaseItem[]) => void
  orgId: string
}

export function PurchaseItemsForm({ items, onChange, orgId }: PurchaseItemsFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState<string>('1')
  const [unitPrice, setUnitPrice] = useState<string>('0')

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !unitPrice) return

    const qty = parseFloat(quantity)
    const price = parseFloat(unitPrice)
    const total = qty * price

    const newItem: PurchaseItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: qty,
      unit_price: price,
      total_price: total,
    }

    onChange([...items, newItem])
    
    // Reset form
    setSelectedProduct(null)
    setQuantity('1')
    setUnitPrice('0')
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  const handleQuantityChange = (index: number, newQuantity: string) => {
    const qty = parseFloat(newQuantity) || 0
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      quantity: qty,
      total_price: qty * newItems[index].unit_price,
    }
    onChange(newItems)
  }

  const handlePriceChange = (index: number, newPrice: string) => {
    const price = parseFloat(newPrice) || 0
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      unit_price: price,
      total_price: price * newItems[index].quantity,
    }
    onChange(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="col-span-5">
          <Label>Produto</Label>
          <ProductSelector
            value={selectedProduct}
            onValueChange={setSelectedProduct}
            orgId={orgId}
            placeholder="Selecione o produto..."
          />
        </div>
        
        <div className="col-span-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qtd"
          />
        </div>
        
        <div className="col-span-3">
          <Label>Preço Unitário</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0,00"
          />
        </div>
        
        <div className="col-span-2 flex items-end">
          <Button
            type="button"
            onClick={handleAddItem}
            disabled={!selectedProduct || !quantity || !unitPrice}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-32">Quantidade</TableHead>
                <TableHead className="w-40">Preço Unit.</TableHead>
                <TableHead className="w-40">Total</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.product_name || 'Produto'}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {item.total_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Total Geral:
                </TableCell>
                <TableCell className="font-bold text-lg">
                  R$ {totalAmount.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          Nenhum item adicionado. Selecione produtos acima para adicionar ao pedido.
        </div>
      )}
    </div>
  )
}
