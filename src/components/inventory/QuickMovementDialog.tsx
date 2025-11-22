import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { useProductCache } from "@/hooks/useProductCache"

interface QuickMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function QuickMovementDialog({ open, onOpenChange, onSuccess }: QuickMovementDialogProps) {
  const { toast } = useToast()
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  const { products, isLoading: loadingProducts } = useProductCache()
  
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "in",
    quantity: 0,
    notes: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentOrg?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Organização ou usuário não identificado",
        variant: "destructive"
      })
      return
    }

    if (!formData.product_id || formData.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          org_id: currentOrg.id,
          product_id: formData.product_id,
          movement_type: formData.movement_type,
          quantity: formData.quantity,
          notes: formData.notes,
          created_by: user.id
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Movimento registrado com sucesso"
      })

      // Reset form
      setFormData({
        product_id: "",
        movement_type: "in",
        quantity: 0,
        notes: ""
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error creating movement:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar movimento",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimento Rápido de Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              disabled={loadingProducts}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement_type">Tipo de Movimento</Label>
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o movimento (opcional)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
