import React, { createContext, useContext, useState, useEffect } from 'react'

interface AnimationContextType {
  animationsEnabled: boolean
  setAnimationsEnabled: (enabled: boolean) => void
  navigationDirection: 'left' | 'right' | 'fade' | 'scale'
  setNavigationDirection: (direction: 'left' | 'right' | 'fade' | 'scale') => void
  isNavigating: boolean
  setIsNavigating: (navigating: boolean) => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [navigationDirection, setNavigationDirection] = useState<'left' | 'right' | 'fade' | 'scale'>('fade')
  const [isNavigating, setIsNavigating] = useState(false)

  // Respect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      if (mediaQuery.matches) {
        setAnimationsEnabled(false)
      }
    }
    
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled,
        setAnimationsEnabled,
        navigationDirection,
        setNavigationDirection,
        isNavigating,
        setIsNavigating,
      }}
    >
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}