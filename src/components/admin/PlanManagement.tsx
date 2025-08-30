import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Save, X, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: string
  features: string[]
  max_users: number
  max_invoices: number
  max_customers: number
  is_active: boolean
  sort_order: number
}

interface PlanFormData {
  name: string
  description: string
  price: string
  features: string
  max_users: string
  max_invoices: string
  max_customers: string
  is_active: boolean
  sort_order: string
}

export function PlanManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    features: '',
    max_users: '',
    max_invoices: '',
    max_customers: '',
    is_active: true,
    sort_order: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order')

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      features: plan.features.join('\n'),
      max_users: plan.max_users === -1 ? '-1' : plan.max_users.toString(),
      max_invoices: plan.max_invoices === -1 ? '-1' : plan.max_invoices.toString(),
      max_customers: plan.max_customers === -1 ? '-1' : plan.max_customers.toString(),
      is_active: plan.is_active,
      sort_order: plan.sort_order.toString()
    })
  }

  const cancelEditing = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      features: '',
      max_users: '',
      max_invoices: '',
      max_customers: '',
      is_active: true,
      sort_order: ''
    })
  }

  const savePlan = async () => {
    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        features: formData.features.split('\n').filter(f => f.trim()),
        max_users: parseInt(formData.max_users),
        max_invoices: parseInt(formData.max_invoices),
        max_customers: parseInt(formData.max_customers),
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order)
      }

      const { error } = await supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', editingPlan)

      if (error) throw error

      toast.success('Plano atualizado com sucesso!')
      cancelEditing()
      fetchPlans()
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      toast.error('Erro ao salvar plano')
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error

      toast.success('Plano excluído com sucesso!')
      fetchPlans()
    } catch (error) {
      console.error('Erro ao excluir plano:', error)
      toast.error('Erro ao excluir plano')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit.toString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando planos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Gerenciamento de Planos
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-6 space-y-4"
            >
              {editingPlan === plan.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Plano</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Recursos (um por linha)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Máx. Usuários (-1 = ilimitado)</Label>
                      <Input
                        type="number"
                        value={formData.max_users}
                        onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Máx. Faturas (-1 = ilimitado)</Label>
                      <Input
                        type="number"
                        value={formData.max_invoices}
                        onChange={(e) => setFormData({ ...formData, max_invoices: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Máx. Clientes (-1 = ilimitado)</Label>
                      <Input
                        type="number"
                        value={formData.max_customers}
                        onChange={(e) => setFormData({ ...formData, max_customers: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Plano Ativo</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={savePlan}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                      <p className="text-2xl font-bold text-primary mt-2">
                        {formatPrice(plan.price)}/mês
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Recursos:</h4>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Limites:</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Usuários: {formatLimit(plan.max_users)}</div>
                        <div>Faturas: {formatLimit(plan.max_invoices)}</div>
                        <div>Clientes: {formatLimit(plan.max_customers)}</div>
                        <div>Ordem: {plan.sort_order}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}