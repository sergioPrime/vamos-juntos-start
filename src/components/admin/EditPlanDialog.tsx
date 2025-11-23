import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubscriptionPlan, PlanFormData } from '@/hooks/usePlans'

interface EditPlanDialogProps {
  plan: SubscriptionPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, data: Partial<PlanFormData>) => Promise<boolean>
}

export function EditPlanDialog({ plan, open, onOpenChange, onSubmit }: EditPlanDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<PlanFormData>>({})
  const [featuresText, setFeaturesText] = useState('')

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        max_users: plan.max_users || -1,
        max_invoices: plan.max_invoices || -1,
        max_customers: plan.max_customers || -1,
        is_active: plan.is_active || false,
        sort_order: plan.sort_order || 1
      })
      setFeaturesText((plan.features || []).join('\n'))
    }
  }, [plan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return

    setSubmitting(true)

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    const success = await onSubmit(plan.id, {
      ...formData,
      features
    })

    setSubmitting(false)
    
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plano</DialogTitle>
          <DialogDescription>
            Atualize as configurações do plano de assinatura
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
            <Select
              value={formData.billing_cycle || 'monthly'}
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
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_users">Máx. Usuários</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users || -1}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">-1 para ilimitado</p>
            </div>
            <div>
              <Label htmlFor="max_invoices">Máx. Faturas/mês</Label>
              <Input
                id="max_invoices"
                type="number"
                value={formData.max_invoices || -1}
                onChange={(e) => setFormData({ ...formData, max_invoices: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">-1 para ilimitado</p>
            </div>
            <div>
              <Label htmlFor="max_customers">Máx. Clientes</Label>
              <Input
                id="max_customers"
                type="number"
                value={formData.max_customers || -1}
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
              value={formData.sort_order || 1}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active || false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Plano Ativo</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
