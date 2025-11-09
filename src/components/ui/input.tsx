import * as React from "react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export interface InputProps extends React.ComponentProps<"input"> {
  uppercase?: boolean
  blockSpecialChars?: boolean
  allowedChars?: RegExp
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, uppercase = false, blockSpecialChars = false, allowedChars, onChange, ...props }, ref) => {
    const { toast } = useToast()
    const [lastInvalidChar, setLastInvalidChar] = React.useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value
      const target = e.target
      const start = target.selectionStart
      const end = target.selectionEnd

      // Validar caracteres especiais
      if (blockSpecialChars || allowedChars) {
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

      // Converter para maiúsculas se necessário
      if (uppercase && type !== "password" && type !== "email") {
        value = value.toUpperCase()
      }

      // Atualizar o valor do input
      target.value = value
      
      // Restaurar posição do cursor
      if (start !== null && end !== null) {
        target.setSelectionRange(start, end)
      }
      
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
          uppercase && type !== "password" && type !== "email" && "uppercase",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
