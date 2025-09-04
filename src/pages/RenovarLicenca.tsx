import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"

export default function RenovarLicenca() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Renovar Licença</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e planos</p>
      </div>

      <SubscriptionPlans />
    </div>
  )
}