import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, AlertCircle, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function StripeWebhookGuide() {
  const [copied, setCopied] = useState(false)
  
  const webhookUrl = `${window.location.origin}/functions/v1/stripe-webhook`
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success('URL copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  const requiredEvents = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurar Webhook do Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Os webhooks do Stripe são essenciais para sincronizar automaticamente 
              assinaturas e pagamentos com o sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">1. URL do Webhook</h3>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Acessar Dashboard do Stripe</h3>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
              >
                Abrir Stripe Dashboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Eventos Necessários</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requiredEvents.map((event) => (
                  <Badge key={event} variant="secondary">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
