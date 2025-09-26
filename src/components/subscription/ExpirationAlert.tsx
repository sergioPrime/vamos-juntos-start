import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CreditCard } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"

export function ExpirationAlert() {
  const { showExpirationAlert, daysUntilExpiration, subscription_end } = useSubscription()

  const handleRenewSubscription = () => {
    window.location.href = '/settings/renovar-licenca'
  }

  if (!showExpirationAlert) return null

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-orange-800">
            ⚠️ Sua assinatura expira em {daysUntilExpiration} dia(s)
            {subscription_end && (
              <> ({new Date(subscription_end).toLocaleDateString('pt-BR')})</>
            )}
          </span>
        </div>
        <Button 
          onClick={handleRenewSubscription}
          variant="outline"
          size="sm"
          className="ml-4 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Renovar Agora
        </Button>
      </AlertDescription>
    </Alert>
  )
}