import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAnimation } from '@/contexts/AnimationContext'

interface RouteConfig {
  path: string
  isModule: boolean
  isDashboard: boolean
}

const routes: RouteConfig[] = [
  { path: '/', isDashboard: true, isModule: false },
  { path: '/dashboard', isDashboard: true, isModule: false },
  { path: '/purchases', isDashboard: false, isModule: true },
  { path: '/orders', isDashboard: false, isModule: true },
  { path: '/inventory', isDashboard: false, isModule: true },
  { path: '/finance', isDashboard: false, isModule: true },
  { path: '/pdv', isDashboard: false, isModule: true },
  { path: '/quotes', isDashboard: false, isModule: true },
  { path: '/reports', isDashboard: false, isModule: true },
  { path: '/customers', isDashboard: false, isModule: true },
  { path: '/suppliers', isDashboard: false, isModule: true },
  { path: '/products', isDashboard: false, isModule: true },
]

export function usePageTransition() {
  const location = useLocation()
  const { setNavigationDirection, setIsNavigating } = useAnimation()

  useEffect(() => {
    const currentRoute = routes.find(route => 
      location.pathname === route.path || location.pathname.startsWith(route.path + '/')
    )
    
    if (!currentRoute) return

    // Determine transition direction based on navigation pattern
    const previousPath = sessionStorage.getItem('previousPath')
    const previousRoute = routes.find(route => 
      previousPath === route.path || (previousPath && previousPath.startsWith(route.path + '/'))
    )

    if (previousRoute && currentRoute) {
      if (previousRoute.isDashboard && currentRoute.isModule) {
        // Dashboard → Module = slide left
        setNavigationDirection('left')
      } else if (previousRoute.isModule && currentRoute.isDashboard) {
        // Module → Dashboard = slide right
        setNavigationDirection('right')
      } else if (location.pathname.includes('/reports')) {
        // Reports = fade + stagger
        setNavigationDirection('fade')
      } else {
        // Default fade
        setNavigationDirection('fade')
      }
    }

    // Store current path for next navigation
    sessionStorage.setItem('previousPath', location.pathname)
  }, [location.pathname, setNavigationDirection])

  const navigateWithTransition = (to: string) => {
    setIsNavigating(true)
    
    setTimeout(() => {
      const navigate = useNavigate()
      navigate(to)
      setIsNavigating(false)
    }, 50)
  }

  return { navigateWithTransition }
}