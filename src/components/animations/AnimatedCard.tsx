import { ReactNode, forwardRef } from 'react'
import { Card } from '@/components/ui/card'
import { useAnimation } from '@/contexts/AnimationContext'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'none'
  delay?: number
  highlight?: 'success' | 'error' | 'warning' | 'none'
  onAnimationComplete?: () => void
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    children, 
    className, 
    hoverEffect = 'lift',
    delay = 0,
    highlight = 'none',
    onAnimationComplete,
    ...props 
  }, ref) => {
    const { animationsEnabled } = useAnimation()

    const getHoverClasses = () => {
      if (!animationsEnabled || hoverEffect === 'none') return ''
      
      switch (hoverEffect) {
        case 'lift':
          return 'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]'
        case 'scale':
          return 'hover:scale-105'
        case 'glow':
          return 'hover:shadow-xl hover:shadow-primary/20'
        default:
          return ''
      }
    }

    const getHighlightClasses = () => {
      if (highlight === 'none') return ''
      
      const baseHighlight = animationsEnabled ? 'animate-pulse' : ''
      
      switch (highlight) {
        case 'success':
          return cn(baseHighlight, 'border-green-500 bg-green-50 dark:bg-green-950/20')
        case 'error':
          return cn(baseHighlight, 'border-red-500 bg-red-50 dark:bg-red-950/20')
        case 'warning':
          return cn(baseHighlight, 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20')
        default:
          return ''
      }
    }

    const getAnimationClasses = () => {
      if (!animationsEnabled) return ''
      return 'animate-fade-in transition-all duration-300 ease-out'
    }

    return (
      <Card
        ref={ref}
        className={cn(
          getAnimationClasses(),
          getHoverClasses(),
          getHighlightClasses(),
          className
        )}
        style={{
          animationDelay: `${delay}ms`
        }}
        onAnimationEnd={onAnimationComplete}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'