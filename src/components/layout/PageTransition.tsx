import { ReactNode, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useAnimation } from "@/contexts/AnimationContext"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: ReactNode
  direction?: "left" | "right" | "fade" | "scale"
  duration?: number
}

export function PageTransition({ children, direction, duration = 300 }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const location = useLocation()
  const { animationsEnabled, navigationDirection } = useAnimation()

  // Use context direction if not explicitly provided
  const effectiveDirection = direction || navigationDirection

  useEffect(() => {
    setIsExiting(true)
    setIsVisible(false)
    
    const timer = setTimeout(() => {
      setIsExiting(false)
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [location.pathname])

  const getAnimationClass = () => {
    if (!animationsEnabled) return "opacity-100"
    
    if (isExiting) {
      switch (effectiveDirection) {
        case "left":
          return "opacity-0 -translate-x-full"
        case "right":
          return "opacity-0 translate-x-full"
        case "scale":
          return "opacity-0 scale-95"
        case "fade":
        default:
          return "opacity-0"
      }
    }

    if (!isVisible) {
      switch (effectiveDirection) {
        case "left":
          return "opacity-0 translate-x-full"
        case "right":
          return "opacity-0 -translate-x-full"
        case "scale":
          return "opacity-0 scale-95"
        case "fade":
        default:
          return "opacity-0 translate-y-2"
      }
    }
    
    return "opacity-100 translate-x-0 translate-y-0 scale-100"
  }

  const getDuration = () => {
    if (!animationsEnabled) return "duration-0"
    return `duration-${duration}`
  }

  return (
    <div className={cn(
      "transition-all ease-in-out",
      getDuration(),
      getAnimationClass()
    )}>
      {children}
    </div>
  )
}