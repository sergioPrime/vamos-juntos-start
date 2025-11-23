import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { PlanFormData } from '@/hooks/usePlans'

interface CreatePlanDialogProps {
  onSubmit: (data: PlanFormData) => Promise<boolean>
}

export function CreatePlanDialog({ onSubmit }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    features: [],
    max_users: -1,
    max_invoices: -1,
    max_customers: -1,
    is_active: true,
    sort_order: 1
  })
  const [featuresText, setFeaturesText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    const success = await onSubmit({
      ...formData,
      features
    })

    setSubmitting(false)
    
    if (success) {
      setOpen(false)
      setFormData({
        name: '',
        description: '',
        price: 0,
        billing_cycle: 'monthly',
        features: [],
        max_users: -1,
        max_invoices: -1,
        max_customers: -1,
        is_active: true,
        sort_order: 1
      })
      setFeaturesText('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano</DialogTitle>
          <DialogDescription>
            Configure um novo plano de assinatura para o sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano Básico"
              />
            </div>
            <div>
              <Label htmlFor="price">Preço Mensal (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descrição do plano"
            />
          </div>

          <div>
            <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="features">Recursos (um por linha)</Label>
            <Textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={6}
              placeholder="Digite um recurso por linha&#10;Ex: Até 5 usuários&#10;100 NFe por mês&#10;Suporte via email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_users">Máx. Usuários</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">-1 para ilimitado</p>
            </div>
            <div>
              <Label htmlFor="max_invoices">Máx. Faturas/mês</Label>
              <Input
                id="max_invoices"
                type="number"
                value={formData.max_invoices}
                onChange={(e) => setFormData({ ...formData, max_invoices: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">-1 para ilimitado</p>
            </div>
            <div>
              <Label htmlFor="max_customers">Máx. Clientes</Label>
              <Input
                id="max_customers"
                type="number"
                value={formData.max_customers}
                onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">-1 para ilimitado</p>
            </div>
          </div>

          <div>
            <Label htmlFor="sort_order">Ordem de Exibição</Label>
            <Input
              id="sort_order"
              type="number"
              min="1"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Plano Ativo</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
