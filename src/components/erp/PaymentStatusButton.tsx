import { useState } from 'react'
import { Check, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnimatedToast } from '@/components/animations/AnimatedToast'
import { useAnimation } from '@/contexts/AnimationContext'
import { cn } from '@/lib/utils'

interface PaymentStatusButtonProps {
  isPaid: boolean
  onTogglePayment: (paid: boolean) => Promise<void>
  className?: string
}

export function PaymentStatusButton({ 
  isPaid, 
  onTogglePayment, 
  className 
}: PaymentStatusButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const { showSuccess, showError } = useAnimatedToast()
  const { animationsEnabled } = useAnimation()

  const handleSwipeAction = async () => {
    try {
      setIsAnimating(true)
      
      if (animationsEnabled) {
        // Swipe animation delay
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      await onTogglePayment(!isPaid)
      
      if (!isPaid) {
        showSuccess(
          'Pagamento confirmado!',
          'O status foi alterado para pago.'
        )
      } else {
        showSuccess(
          'Pagamento cancelado',
          'O status foi alterado para pendente.'
        )
      }
      
    } catch (error) {
      showError(
        'Erro ao atualizar pagamento',
        'Não foi possível alterar o status. Tente novamente.'
      )
    } finally {
      setIsAnimating(false)
    }
  }

  return (
    <Button
      onClick={handleSwipeAction}
      disabled={isAnimating}
      variant={isPaid ? "default" : "outline"}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isPaid && "bg-green-600 hover:bg-green-700 text-white",
        !isPaid && "border-green-300 text-green-700 hover:bg-green-50",
        isAnimating && animationsEnabled && "animate-pulse",
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-2 transition-transform duration-200",
        isAnimating && animationsEnabled && "translate-x-2"
      )}>
        {isPaid ? (
          <Check className={cn(
            "h-4 w-4",
            isAnimating && animationsEnabled && "animate-success-bounce"
          )} />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {isPaid ? 'Pago' : 'Marcar como Pago'}
      </div>
      
      {/* Swipe indicator */}
      {!isPaid && animationsEnabled && (
        <div className={cn(
          "absolute inset-y-0 left-0 bg-green-100 transition-all duration-300 -z-10",
          isAnimating ? "w-full" : "w-0"
        )} />
      )}
    </Button>
  )
}