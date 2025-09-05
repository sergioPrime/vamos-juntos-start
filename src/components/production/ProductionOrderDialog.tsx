import { useState } from 'react'
import { Package, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface OrderItem {
  id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface ProductionOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderItems: OrderItem[]
  onConfirm: () => void
}

export const ProductionOrderDialog = ({
  open,
  onOpenChange,
  orderItems,
  onConfirm
}: ProductionOrderDialogProps) => {
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({})
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    const newSelected: Record<number, boolean> = {}
    if (checked) {
      orderItems.forEach((_, index) => {
        newSelected[index] = true
      })
    }
    setSelectedItems(newSelected)
  }

  const handleItemSelect = (index: number, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: checked
    }))
  }

  const selectedCount = Object.values(selectedItems).filter(Boolean).length

  const handleGenerate = () => {
    if (selectedCount === 0) {
      return
    }
    
    onConfirm()
    
    // Reset form
    setSelectedItems({})
    setSelectAll(false)
    setPriority('medium')
    setDueDate('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerar Ordem de Produção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Selecionar Itens para Produção</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">Selecionar Todos</Label>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {orderItems.map((item, index) => (
                <Card key={index} className="bg-level-3">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`item-${index}`}
                        checked={selectedItems[index] || false}
                        onCheckedChange={(checked) => handleItemSelect(index, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Label htmlFor={`item-${index}`} className="font-medium cursor-pointer">
                              {item.product_name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Quantidade: {item.quantity} • Preço: R$ {item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">R$ {item.total_price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {orderItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item disponível para produção</p>
              </div>
            )}
          </div>

          {/* Production Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="due-date">Data de Entrega</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="production-notes">Observações da Produção</Label>
            <Textarea
              id="production-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções especiais, materiais necessários, etc..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Summary */}
          {selectedCount > 0 && (
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {selectedCount} item(s) selecionado(s) para produção
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={selectedCount === 0}
            className="btn-action-primary"
          >
            <Package className="h-4 w-4 mr-2" />
            Gerar Ordem de Produção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}