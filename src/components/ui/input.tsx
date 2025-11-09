import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  uppercase?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, uppercase = false, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (uppercase && type !== "password" && type !== "email") {
        const target = e.target
        const start = target.selectionStart
        const end = target.selectionEnd
        
        target.value = target.value.toUpperCase()
        
        // Restaurar posição do cursor
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
