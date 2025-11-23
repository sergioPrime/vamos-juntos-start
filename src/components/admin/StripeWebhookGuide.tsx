import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Info, CheckCircle2 } from "lucide-react"

export function StripeWebhookGuide() {
  const webhookUrl = `https://wrdyffwjlylgxfbxbztf.supabase.co/functions/v1/stripe-webhook`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Webhook Stripe</CardTitle>
        <CardDescription>
          Configure o webhook do Stripe para sincronização automática de assinaturas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O webhook permite que o sistema seja notificado automaticamente sobre eventos do Stripe
            (pagamentos, cancelamentos, etc.)
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Passo 1: Acesse o Dashboard do Stripe
          </h4>
          <p className="text-sm text-muted-foreground ml-6">
            Navegue até Developers → Webhooks no dashboard do Stripe
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-6"
            onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Abrir Dashboard Stripe
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Passo 2: Adicione o Endpoint
          </h4>
          <p className="text-sm text-muted-foreground ml-6">
            Clique em "Add endpoint" e cole a URL abaixo:
          </p>
          <div className="ml-6 flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
              {webhookUrl}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              Copiar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Passo 3: Selecione os Eventos
          </h4>
          <p className="text-sm text-muted-foreground ml-6">
            Selecione os seguintes eventos para escutar:
          </p>
          <div className="ml-6 flex flex-wrap gap-2">
            <Badge variant="outline">checkout.session.completed</Badge>
            <Badge variant="outline">customer.subscription.updated</Badge>
            <Badge variant="outline">customer.subscription.deleted</Badge>
            <Badge variant="outline">invoice.payment_succeeded</Badge>
            <Badge variant="outline">invoice.payment_failed</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Passo 4: Configure o Secret (Opcional mas Recomendado)
          </h4>
          <p className="text-sm text-muted-foreground ml-6">
            Após criar o webhook, copie o "Signing secret" e adicione como variável de ambiente:
          </p>
          <code className="ml-6 block bg-muted px-3 py-2 rounded text-sm">
            STRIPE_WEBHOOK_SECRET=whsec_...
          </code>
          <p className="text-xs text-muted-foreground ml-6">
            Isso garante que apenas o Stripe pode acionar o webhook.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota:</strong> O webhook funciona mesmo sem o secret configurado, mas é
            altamente recomendado para segurança em produção.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
