import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Building } from 'lucide-react'

export function AuthRedirect() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl mx-auto mb-6">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Prime ERP</h1>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // If user is not authenticated and not on the landing page, redirect to auth
  if (location.pathname !== '/') {
    return <Navigate to="/auth" replace />
  }

  // Otherwise, stay on the landing page
  return <Navigate to="/" replace />
}