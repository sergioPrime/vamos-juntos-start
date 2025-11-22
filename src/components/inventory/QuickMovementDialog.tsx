import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  sku?: string
}

interface QuickMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSuccess: () => void
}

export function QuickMovementDialog({
  open,
  onOpenChange,
  products,
  onSuccess
}: QuickMovementDialogProps) {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "in",
    quantity: 0,
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.product_id || formData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: formData.product_id,
          movement_type: formData.movement_type,
          quantity: formData.quantity,
          notes: formData.notes,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (error) throw error

      toast({
        title: "Movimentação registrada",
        description: "A movimentação de estoque foi registrada com sucesso.",
      })

      setFormData({
        product_id: "",
        movement_type: "in",
        quantity: 0,
        notes: ""
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao registrar movimentação",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} {product.sku && `(${product.sku})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Movimentação</Label>
            <Select
              value={formData.movement_type}
              onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre a movimentação..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Movimentação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
