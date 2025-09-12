import { useEffect, useState } from 'react'
import { useAnimation } from '@/contexts/AnimationContext'
import { useCountUp } from '@/hooks/useCountUp'

interface CountUpNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  format?: 'number' | 'currency' | 'percentage'
  locale?: string
}

export function CountUpNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  className = '',
  format = 'number',
  locale = 'pt-BR'
}: CountUpNumberProps) {
  const { animationsEnabled } = useAnimation()
  const [startAnimation, setStartAnimation] = useState(false)
  
  // Only start animation when component is in view
  useEffect(() => {
    const timer = setTimeout(() => setStartAnimation(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const animatedValue = useCountUp(
    startAnimation && animationsEnabled ? value : 0,
    animationsEnabled ? duration : 0
  )

  const displayValue = animationsEnabled ? animatedValue : value

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'BRL'
        }).format(val)
      case 'percentage':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(val / 100)
      case 'number':
      default:
        return new Intl.NumberFormat(locale).format(val)
    }
  }

  return (
    <span className={className}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  )
}