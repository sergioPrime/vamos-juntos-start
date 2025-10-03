import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/utils/passwordValidation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PasswordStrengthIndicatorProps {
  password: string
  showErrors?: boolean
}

export function PasswordStrengthIndicator({ password, showErrors = true }: PasswordStrengthIndicatorProps) {
  if (!password) return null
  
  const validation = validatePassword(password)
  const strengthColor = getPasswordStrengthColor(validation.strength)
  const strengthLabel = getPasswordStrengthLabel(validation.strength)
  
  return (
    <div className="space-y-2">
      {/* Indicador de força */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              validation.strength === 'weak' ? 'bg-red-500 w-1/3' :
              validation.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
              'bg-green-500 w-full'
            }`}
          />
        </div>
        <span className={`text-sm font-medium ${strengthColor}`}>
          {strengthLabel}
        </span>
      </div>
      
      {/* Lista de erros/requisitos */}
      {showErrors && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Mensagem de sucesso */}
      {validation.isValid && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            Senha segura! Todos os requisitos foram atendidos.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Dicas de segurança */}
      {!validation.isValid && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Dicas:</strong> Use uma combinação de letras maiúsculas, minúsculas, números e símbolos. 
            Evite senhas óbvias como "123456" ou "senha123".
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
