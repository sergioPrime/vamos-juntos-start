import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useMask, type MaskType } from "@/hooks/useMask"

export interface InputProps extends React.ComponentProps<"input"> {
  uppercase?: boolean
  blockSpecialChars?: boolean
  allowedChars?: RegExp
  mask?: MaskType
  onValueChange?: (value: string) => void
  validateDocument?: boolean
  validateCNAE?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, uppercase = false, blockSpecialChars = false, allowedChars, mask, onChange, onValueChange, validateDocument = false, validateCNAE = false, ...props }, ref) => {
    const { toast } = useToast()
    const { applyMask, removeMask, getConfig, detectDocumentType, validateCPF, validateCNPJ, validateCNAE: validateCNAEFn } = useMask(mask)
    const [lastInvalidChar, setLastInvalidChar] = React.useState<string | null>(null)
    const [documentValidation, setDocumentValidation] = React.useState<{ isValid: boolean; message: string } | null>(null)
    const [cnaeValidation, setCnaeValidation] = React.useState<{ isValid: boolean; message: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value
      const target = e.target
      const start = target.selectionStart
      const end = target.selectionEnd

      // Aplicar máscara se definida
      if (mask && mask !== 'none') {
        value = applyMask(value, mask)
        target.value = value
        
        // Chamar onValueChange com valor sem máscara
        if (onValueChange) {
          onValueChange(removeMask(value, mask))
        }
      }

      // Validar caracteres especiais (não aplicar para campos com máscara de moeda)
      if ((blockSpecialChars || allowedChars) && mask !== 'currency') {
        const invalidCharsRegex = allowedChars || /[<>\/\\:*?"'|]/g
        const invalidChars = value.match(invalidCharsRegex)
        
        if (invalidChars && invalidChars.length > 0) {
          const invalidChar = invalidChars[0]
          
          // Só mostra toast se for um caractere diferente do último inválido
          if (invalidChar !== lastInvalidChar) {
            toast({
              title: "Caractere inválido",
              description: `O caractere "${invalidChar}" não é permitido neste campo.`,
              variant: "destructive",
              duration: 2000,
            })
            setLastInvalidChar(invalidChar)
            
            // Limpar o último caractere inválido após 1 segundo
            setTimeout(() => setLastInvalidChar(null), 1000)
          }
          
          // Remove caracteres inválidos
          value = value.replace(invalidCharsRegex, '')
        }
      }

      // Converter para maiúsculas se necessário (não aplicar em campos com máscara)
      if (uppercase && type !== "password" && type !== "email" && !mask) {
        value = value.toUpperCase()
      }

      // Validar documento se necessário
      if (validateDocument && value.length > 0) {
        const docType = detectDocumentType(value)
        const numbers = value.replace(/\D/g, '')
        
        if (numbers.length === 11 || numbers.length === 14) {
          const isValid = docType === 'cpf' ? validateCPF(value) : validateCNPJ(value)
          
          if (isValid) {
            setDocumentValidation({
              isValid: true,
              message: `${docType === 'cpf' ? 'CPF' : 'CNPJ'} válido`
            })
          } else {
            setDocumentValidation({
              isValid: false,
              message: `${docType === 'cpf' ? 'CPF' : 'CNPJ'} inválido - verifique os dígitos`
            })
          }
        } else if (numbers.length > 0) {
          setDocumentValidation({
            isValid: false,
            message: 'Digite o documento completo'
          })
        } else {
          setDocumentValidation(null)
        }
      }

      // Validar CNAE se necessário
      if (validateCNAE && value.length > 0) {
        const numbers = value.replace(/\D/g, '')
        
        if (numbers.length === 7) {
          const isValid = validateCNAEFn(value)
          
          if (isValid) {
            setCnaeValidation({
              isValid: true,
              message: 'CNAE válido'
            })
          } else {
            setCnaeValidation({
              isValid: false,
              message: 'CNAE inválido - verifique o dígito verificador'
            })
          }
        } else if (numbers.length > 0) {
          setCnaeValidation({
            isValid: false,
            message: 'Digite o CNAE completo (7 dígitos)'
          })
        } else {
          setCnaeValidation(null)
        }
      }

      // Atualizar o valor do input
      target.value = value
      
      // Restaurar posição do cursor (não aplicar para moeda pois a máscara reposiciona)
      if (start !== null && end !== null && mask !== 'currency') {
        target.setSelectionRange(start, end)
      }
      
      if (onChange) {
        onChange(e)
      }
    }

    const maskConfig = mask ? getConfig(mask) : null

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
            uppercase && type !== "password" && type !== "email" && !mask && "uppercase",
            validateDocument && documentValidation && !documentValidation.isValid && "border-destructive focus-visible:ring-destructive",
            validateDocument && documentValidation && documentValidation.isValid && "border-green-500 focus-visible:ring-green-500",
            validateCNAE && cnaeValidation && !cnaeValidation.isValid && "border-destructive focus-visible:ring-destructive",
            validateCNAE && cnaeValidation && cnaeValidation.isValid && "border-green-500 focus-visible:ring-green-500",
            (validateDocument || validateCNAE) && "pr-10",
            className
          )}
          ref={ref}
          onChange={handleChange}
          maxLength={maskConfig?.maxLength}
          placeholder={maskConfig?.placeholder || props.placeholder}
          {...props}
        />
        {validateDocument && documentValidation && (
          <>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {documentValidation.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            {!documentValidation.isValid && (
              <p className="mt-1 text-xs text-destructive">
                {documentValidation.message}
              </p>
            )}
          </>
        )}
        {validateCNAE && cnaeValidation && (
          <>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cnaeValidation.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            {!cnaeValidation.isValid && (
              <p className="mt-1 text-xs text-destructive">
                {cnaeValidation.message}
              </p>
            )}
          </>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
