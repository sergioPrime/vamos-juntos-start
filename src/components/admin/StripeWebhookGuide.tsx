import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, AlertCircle, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function StripeWebhookGuide() {
  const [copied, setCopied] = useState(false)
  
  // This should be your actual deployed function URL
  const webhookUrl = `${window.location.origin}/functions/v1/stripe-webhook`
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success('URL copiada para área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  const requiredEvents = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Configurar Webhook do Stripe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Os webhooks do Stripe são essenciais para sincronizar automaticamente 
              assinaturas, pagamentos e cancelamentos com o sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">1. URL do Webhook</h3>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
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
              <p className="text-sm text-muted-foreground mb-2">
                Configure o webhook para escutar os seguintes eventos:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requiredEvents.map((event) => (
                  <Badge key={event} variant="secondary" className="justify-start">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Verificação</h3>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Após configurar o webhook, você pode testar enviando um evento de teste 
                  pelo dashboard do Stripe. Os logs aparecerão na aba "Webhook Logs" abaixo.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 list-decimal list-inside">
            <li className="text-sm">
              <span className="font-medium">Acesse o Stripe Dashboard</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Faça login em sua conta Stripe e navegue até a seção de Webhooks
              </p>
            </li>
            <li className="text-sm">
              <span className="font-medium">Adicione um novo endpoint</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Clique em "Add endpoint" e cole a URL do webhook acima
              </p>
            </li>
            <li className="text-sm">
              <span className="font-medium">Selecione os eventos</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Adicione todos os eventos listados acima para garantir sincronização completa
              </p>
            </li>
            <li className="text-sm">
              <span className="font-medium">Copie o Signing Secret</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Após criar o webhook, copie o "Signing secret" (começa com whsec_)
              </p>
            </li>
            <li className="text-sm">
              <span className="font-medium">Configure o Secret no Supabase</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Adicione STRIPE_WEBHOOK_SECRET nas variáveis de ambiente do Supabase
              </p>
            </li>
            <li className="text-sm">
              <span className="font-medium">Teste o webhook</span>
              <p className="text-muted-foreground ml-6 mt-1">
                Use o botão "Send test webhook" no Stripe para verificar se está funcionando
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
