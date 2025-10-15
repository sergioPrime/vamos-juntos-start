import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"

interface QuickProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialName?: string
}

export const QuickProductDialog = ({ open, onOpenChange, onSuccess, initialName = "" }: QuickProductDialogProps) => {
  const { toast } = useToast()
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialName,
    sku: "",
    unit_price: "",
    stock_quantity: "",
    unit: "UN"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentOrg?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Organização ou usuário não encontrado",
        variant: "destructive"
      })
      return
    }

    if (!formData.name || !formData.unit_price) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e preço do produto",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          org_id: currentOrg.id,
          owner_id: user.id,
          name: formData.name,
          sku: formData.sku || `SKU${Date.now()}`,
          unit_price: parseFloat(formData.unit_price),
          cost_price: 0,
          stock_quantity: parseFloat(formData.stock_quantity) || 0,
          min_stock_level: 0,
          unit: formData.unit,
          active: true
        }])

      if (error) throw error

      toast({
        title: "Produto cadastrado",
        description: "Produto adicionado com sucesso!",
      })

      setFormData({
        name: "",
        sku: "",
        unit_price: "",
        stock_quantity: "",
        unit: "UN"
      })
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: "Erro ao cadastrar produto",
        description: "Não foi possível cadastrar o produto.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Produto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do produto"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">Código/SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Código do produto (opcional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Preço Unitário *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Estoque Inicial</Label>
              <Input
                id="stock_quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="UN"
              maxLength={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
