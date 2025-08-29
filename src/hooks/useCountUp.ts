import { useEffect, useState } from "react"

export function useCountUp(end: number, duration: number = 800, start: number = 0) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isAnimating) {
      setIsAnimating(true)
      let startTime: number
      const startValue = start

      const animate = (currentTime: number) => {
        if (startTime === undefined) startTime = currentTime
        const timeElapsed = currentTime - startTime
        const progress = Math.min(timeElapsed / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (end - startValue) * easeOutQuart

        setCount(Math.floor(currentValue))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [end, duration, start, isAnimating])

  return count
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}