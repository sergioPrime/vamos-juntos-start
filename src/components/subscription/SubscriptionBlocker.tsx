import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CreditCard } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"

export function SubscriptionBlocker() {
  const { isExpired, daysUntilExpiration, subscription_end } = useSubscription()

  const handleRenewSubscription = () => {
    window.location.href = '/settings?tab=planos'
  }

  if (!isExpired) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Assinatura Expirada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Sua assinatura expirou em{' '}
            {subscription_end && new Date(subscription_end).toLocaleDateString('pt-BR')}.
          </p>
          <p className="text-sm text-muted-foreground">
            Para continuar usando o sistema, renove sua assinatura agora.
          </p>
          <Button 
            onClick={handleRenewSubscription} 
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Renovar Assinatura
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}