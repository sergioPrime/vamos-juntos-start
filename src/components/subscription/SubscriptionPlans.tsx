import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Edit } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
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
  sort_order: number
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentOrg: organization } = useOrganization()
  const { isSuperAdmin } = useSuperAdmin()

  useEffect(() => {
    fetchPlans()
    fetchCurrentPlan()
  }, [organization])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos de assinatura')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentPlan = async () => {
    if (!organization) return

    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('org_id', organization.id)
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCurrentPlanId((data as any)?.subscription_plan_id || null)
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error)
    }
  }

  const selectPlan = async (planId: string) => {
    if (!organization || !user) {
      toast.error('Erro: usuário não autenticado')
      return
    }

    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({
          subscription_plan_id: planId,
          subscription_started_at: new Date().toISOString(),
          subscription_status: 'active'
        } as any)
        .eq('org_id', organization.id)
        .eq('user_id', user.id)

      if (error) throw error

      setCurrentPlanId(planId)
      toast.success('Plano selecionado com sucesso!')
    } catch (error) {
      console.error('Erro ao selecionar plano:', error)
      toast.error('Erro ao selecionar plano')
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
          <CardTitle>Planos de Assinatura</CardTitle>
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
        <CardTitle>Planos de Assinatura</CardTitle>
        <p className="text-muted-foreground">
          Escolha o plano que melhor atende às suas necessidades
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId
            const isRecommended = plan.name === 'Profissional'

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-6 ${
                  isCurrentPlan
                    ? 'border-primary bg-primary/5'
                    : isRecommended
                    ? 'border-primary/50'
                    : 'border-border'
                } transition-all hover:border-primary/50`}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Recomendado
                  </Badge>
                )}
                
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    Plano Atual
                  </Badge>
                )}

                {isSuperAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => window.open('/admin', '_blank')}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {plan.description}
                  </p>
                  
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usuários:</span>
                      <span>{formatLimit(plan.max_users)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Faturas:</span>
                      <span>{formatLimit(plan.max_invoices)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clientes:</span>
                      <span>{formatLimit(plan.max_customers)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => selectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className="w-full mt-6"
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}