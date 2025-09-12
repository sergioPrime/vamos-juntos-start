import { forwardRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useButtonAnimation, ButtonState } from '@/hooks/useButtonAnimation'
import { useAnimation } from '@/contexts/AnimationContext'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void
  state?: ButtonState
  successMessage?: string
  errorMessage?: string
  showStateIcons?: boolean
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    children, 
    onClick, 
    state: externalState, 
    successMessage,
    errorMessage,
    showStateIcons = true,
    className,
    disabled,
    ...props 
  }, ref) => {
    const { animationsEnabled } = useAnimation()
    const { state: internalState, executeAction } = useButtonAnimation()
    
    const state = externalState || internalState

    const handleClick = async () => {
      if (!onClick || state === 'loading') return
      
      if (externalState) {
        // External state management
        await onClick()
      } else {
        // Internal state management
        await executeAction(onClick)
      }
    }

    const getButtonContent = () => {
      if (!showStateIcons) return children

      switch (state) {
        case 'loading':
          return (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {children}
            </div>
          )
        case 'success':
          return (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {successMessage || children}
            </div>
          )
        case 'error':
          return (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {errorMessage || children}
            </div>
          )
        default:
          return children
      }
    }

    const getButtonClasses = () => {
      const baseClasses = animationsEnabled ? 'transition-all duration-200' : ''
      
      const stateClasses = {
        idle: animationsEnabled ? 'hover:scale-105 active:scale-95' : '',
        loading: 'cursor-not-allowed',
        success: animationsEnabled ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-green-600',
        error: animationsEnabled ? 'bg-red-600 hover:bg-red-700 animate-bounce' : 'bg-red-600'
      }

      return cn(
        baseClasses,
        stateClasses[state],
        animationsEnabled && state === 'idle' && 'hover:shadow-lg',
        className
      )
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || state === 'loading'}
        className={getButtonClasses()}
        {...props}
      >
        {getButtonContent()}
      </Button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'