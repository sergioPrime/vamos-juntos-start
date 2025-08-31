import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"
import { PermissionsAndAccess } from "@/components/settings/PermissionsAndAccess"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <PermissionsAndAccess />
      <SubscriptionPlans />
    </div>
  )
}