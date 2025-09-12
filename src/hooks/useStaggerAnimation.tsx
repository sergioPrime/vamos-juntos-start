import { useEffect, useState } from 'react'
import { useAnimation } from '@/contexts/AnimationContext'

interface UseStaggerAnimationOptions {
  delay?: number
  duration?: number
  threshold?: number
}

export function useStaggerAnimation(
  itemCount: number, 
  options: UseStaggerAnimationOptions = {}
) {
  const { animationsEnabled } = useAnimation()
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const { delay = 100, duration = 300, threshold = 0.1 } = options

  useEffect(() => {
    if (!animationsEnabled) {
      setVisibleItems(Array.from({ length: itemCount }, (_, i) => i))
      return
    }

    const timeouts: NodeJS.Timeout[] = []
    
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, i])
      }, i * delay)
      
      timeouts.push(timeout)
    }

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [itemCount, delay, animationsEnabled])

  const getItemProps = (index: number) => {
    if (!animationsEnabled) {
      return { className: 'opacity-100' }
    }

    const isVisible = visibleItems.includes(index)
    
    return {
      className: isVisible ? 'animate-fade-in opacity-100' : 'opacity-0',
      style: {
        animationDelay: `${index * delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'forwards'
      }
    }
  }

  const reset = () => {
    setVisibleItems([])
  }

  return {
    getItemProps,
    visibleItems,
    reset,
    isComplete: visibleItems.length === itemCount
  }
}