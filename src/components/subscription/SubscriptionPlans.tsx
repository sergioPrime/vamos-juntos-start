import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, Edit, CreditCard, Settings, QrCode } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { toast } from "sonner"
import { PixPaymentDialog } from "./PixPaymentDialog"

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentOrg: organization } = useOrganization()
  const { isSuperAdmin } = useSuperAdmin()

  useEffect(() => {
    fetchPlans()
    fetchCurrentPlan()
    checkSubscriptionStatus()
  }, [organization])

  useEffect(() => {
    // Check for success/canceled URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      // Wait for subscription status to be checked first
      const checkAndShowSuccess = async () => {
        await checkSubscriptionStatus()
        // Get updated subscription data after a short delay
        setTimeout(async () => {
          const updatedData = await getLatestSubscriptionData()
          if (updatedData?.subscription_end) {
            const endDate = new Date(updatedData.subscription_end).toLocaleDateString('pt-BR')
            toast.success(`🎉 Assinatura ativada com sucesso! Válida até ${endDate}`, {
              duration: 6000,
            })
          } else {
            toast.success('🎉 Assinatura ativada com sucesso!', {
              duration: 4000,
            })
          }
        }, 1000)
      }
      checkAndShowSuccess()
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (urlParams.get('canceled') === 'true') {
      toast.error('Assinatura cancelada')
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

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
        .select('subscription_plan_id, subscription_status')
        .eq('org_id', organization.id)
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCurrentPlanId((data as any)?.subscription_plan_id || null)
      setSubscriptionStatus((data as any)?.subscription_status || 'inactive')
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error)
    }
  }

  const checkSubscriptionStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) throw error
      
      if (data) {
        setCurrentPlanId(data.subscription_plan_id)
        setSubscriptionStatus(data.subscribed ? 'active' : 'inactive')
        setSubscriptionEnd(data.subscription_end)
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error)
    }
  }

  const getLatestSubscriptionData = async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao obter dados da assinatura:', error)
      return null
    }
  }

  const selectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Erro: usuário não autenticado')
      return
    }

    setProcessing(planId)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planId,
          billingCycle: isAnnual ? 'annual' : 'monthly'
        }
      })
      
      if (error) throw error
      
      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setProcessing(null)
    }
  }

  const manageSubscription = async () => {
    if (!user) {
      toast.error('Erro: usuário não autenticado')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal')
      
      if (error) throw error
      
      if (data?.url) {
        // Open Stripe customer portal in new tab
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Erro ao abrir portal do cliente:', error)
      toast.error('Erro ao abrir gerenciamento de assinatura')
    }
  }

  const formatPrice = (price: number) => {
    const finalPrice = isAnnual ? price * 12 * 0.8 : price // 20% desconto anual
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(finalPrice)
  }

  const getOriginalAnnualPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price * 12)
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
        
        {/* Toggle between Monthly and Annual */}
        <div className="flex items-center justify-center space-x-4 py-4">
          <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-semibold' : ''}>
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? 'font-semibold' : ''}>
            Anual
            <Badge variant="secondary" className="ml-2">
              20% desconto
            </Badge>
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status da Assinatura:</p>
              <div className="space-y-1">
                <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                  {subscriptionStatus === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
                {subscriptionStatus === 'active' && subscriptionEnd && (
                  <p className="text-xs text-muted-foreground">
                    Válida até: {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            {subscriptionStatus === 'active' && (
              <Button onClick={manageSubscription} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId && subscriptionStatus === 'active'
              const isRecommended = plan.name === 'Profissional'
              const isProcessing = processing === plan.id

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
                    {isAnnual && (
                      <div className="mb-2">
                        <span className="text-lg text-muted-foreground line-through">
                          {getOriginalAnnualPrice(plan.price)}
                        </span>
                        <Badge variant="destructive" className="ml-2 text-xs">
                          -20%
                        </Badge>
                      </div>
                    )}
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">
                      /{isAnnual ? 'ano' : 'mês'}
                    </span>
                    {isAnnual && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(plan.price * 0.8)} por mês
                      </div>
                    )}
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
                  disabled={isCurrentPlan || isProcessing}
                  className="w-full mt-6"
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {isProcessing ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2 animate-pulse" />
                      Processando...
                    </>
                  ) : isCurrentPlan ? (
                    'Plano Atual'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Assinar Plano
                    </>
                  )}
                </Button>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}