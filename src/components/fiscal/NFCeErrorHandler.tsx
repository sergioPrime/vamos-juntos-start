import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, WifiOff, FileX, AlertTriangle, RefreshCw } from "lucide-react"

interface NFCeErrorHandlerProps {
  error: {
    type: 'connection' | 'validation' | 'rejection' | 'configuration' | 'unknown'
    code?: string
    message: string
    details?: string
  }
  onRetry?: () => void
  onEnableContingency?: () => void
}

const getErrorIcon = (type: string) => {
  switch (type) {
    case 'connection':
      return WifiOff
    case 'validation':
      return FileX
    case 'rejection':
      return AlertTriangle
    case 'configuration':
      return AlertCircle
    default:
      return AlertCircle
  }
}

const getErrorColor = (type: string) => {
  switch (type) {
    case 'connection':
      return 'text-orange-600 dark:text-orange-400'
    case 'validation':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'rejection':
      return 'text-red-600 dark:text-red-400'
    case 'configuration':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getErrorTitle = (type: string) => {
  switch (type) {
    case 'connection':
      return 'Erro de Conexão com SEFAZ'
    case 'validation':
      return 'Erro de Validação'
    case 'rejection':
      return 'NFC-e Rejeitada pela SEFAZ'
    case 'configuration':
      return 'Erro de Configuração'
    default:
      return 'Erro na Emissão'
  }
}

const getSuggestions = (type: string): string[] => {
  switch (type) {
    case 'connection':
      return [
        'Verifique sua conexão com a internet',
        'Confirme se o serviço da SEFAZ está disponível',
        'Tente ativar o modo de contingência para emitir offline',
      ]
    case 'validation':
      return [
        'Verifique os dados do destinatário',
        'Confirme se todos os produtos têm NCM configurado',
        'Revise as informações fiscais dos produtos',
      ]
    case 'rejection':
      return [
        'Leia atentamente a mensagem de rejeição da SEFAZ',
        'Corrija os dados conforme indicado',
        'Verifique se o certificado digital está válido',
      ]
    case 'configuration':
      return [
        'Acesse as configurações fiscais do sistema',
        'Verifique se todos os dados obrigatórios estão preenchidos',
        'Confirme se o certificado digital está instalado',
      ]
    default:
      return [
        'Tente novamente',
        'Se o erro persistir, entre em contato com o suporte',
      ]
  }
}

export const NFCeErrorHandler = ({ error, onRetry, onEnableContingency }: NFCeErrorHandlerProps) => {
  const Icon = getErrorIcon(error.type)
  const colorClass = getErrorColor(error.type)
  const title = getErrorTitle(error.type)
  const suggestions = getSuggestions(error.type)

  return (
    <Card className="border-destructive/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.code && `Código: ${error.code} - `}
            {error.message}
          </AlertTitle>
          {error.details && (
            <AlertDescription className="mt-2">
              {error.details}
            </AlertDescription>
          )}
        </Alert>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Sugestões:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          {onEnableContingency && error.type === 'connection' && (
            <Button onClick={onEnableContingency} variant="default">
              <WifiOff className="mr-2 h-4 w-4" />
              Ativar Contingência
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
