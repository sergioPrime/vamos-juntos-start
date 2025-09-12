import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useAnimation } from '@/contexts/AnimationContext'
import { cn } from '@/lib/utils'

interface SuccessOverlayProps {
  show: boolean
  title: string
  description?: string
  duration?: number
  onComplete?: () => void
}

export function SuccessOverlay({
  show,
  title,
  description,
  duration = 1000,
  onComplete
}: SuccessOverlayProps) {
  const { animationsEnabled } = useAnimation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          onComplete?.()
        }, animationsEnabled ? 300 : 0)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete, animationsEnabled])

  if (!show && !isVisible) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/50 backdrop-blur-sm",
      animationsEnabled && isVisible && "animate-fade-in",
      animationsEnabled && !isVisible && "animate-fade-out"
    )}>
      <div className={cn(
        "bg-background rounded-lg p-8 shadow-lg border",
        "flex flex-col items-center text-center space-y-4",
        "max-w-sm mx-4",
        animationsEnabled && isVisible && "animate-scale-in animate-success-bounce",
        animationsEnabled && !isVisible && "animate-scale-out"
      )}>
        <div className="relative">
          <CheckCircle className="h-16 w-16 text-green-500" />
          {animationsEnabled && (
            <div className="absolute inset-0 h-16 w-16 border-4 border-green-500 rounded-full animate-ping opacity-20" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}