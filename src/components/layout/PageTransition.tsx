import { ReactNode, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

interface PageTransitionProps {
  children: ReactNode
  direction?: "left" | "right" | "fade"
}

export function PageTransition({ children, direction = "left" }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const getAnimationClass = () => {
    if (!isVisible) return "opacity-0 translate-x-full"
    
    switch (direction) {
      case "right":
        return "opacity-100 translate-x-0 transition-all duration-300 ease-out"
      case "fade":
        return "opacity-100 translate-x-0 transition-all duration-500 ease-out animate-fade-in"
      default:
        return "opacity-100 translate-x-0 transition-all duration-300 ease-out"
    }
  }

  return (
    <div className={`${getAnimationClass()}`}>
      {children}
    </div>
  )
}