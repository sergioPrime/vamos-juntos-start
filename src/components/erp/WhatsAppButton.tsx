import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { AnimatedButton } from '@/components/animations/AnimatedButton'
import { useAnimatedToast } from '@/components/animations/AnimatedToast'
import { useAnimation } from '@/contexts/AnimationContext'

interface WhatsAppButtonProps {
  phoneNumber: string
  message: string
  className?: string
}

export function WhatsAppButton({ phoneNumber, message, className }: WhatsAppButtonProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const { showSuccess, showError } = useAnimatedToast()
  const { animationsEnabled } = useAnimation()

  const handleWhatsAppClick = async () => {
    try {
      if (animationsEnabled) {
        setIsSpinning(true)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      
      window.open(whatsappUrl, '_blank')
      
      showSuccess(
        'WhatsApp aberto!',
        'A conversa foi iniciada no WhatsApp.'
      )
      
    } catch (error) {
      showError(
        'Erro ao abrir WhatsApp',
        'Não foi possível abrir o WhatsApp. Tente novamente.'
      )
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <AnimatedButton
      onClick={handleWhatsAppClick}
      variant="outline"
      className={className}
      disabled={isSpinning}
    >
      <MessageSquare 
        className={`h-4 w-4 ${
          isSpinning && animationsEnabled ? 'animate-spin' : ''
        }`} 
      />
      Enviar via WhatsApp
    </AnimatedButton>
  )
}