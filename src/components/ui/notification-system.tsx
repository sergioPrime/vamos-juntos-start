import React, { useState, useEffect } from 'react'
import { Check, Zap, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'reminder'
  title: string
  message: string
  duration?: number
  onClose?: (id: string) => void
}

interface NotificationSystemContextType {
  addNotification: (notification: Omit<NotificationProps, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationSystemContext = React.createContext<NotificationSystemContextType | null>(null)

export function useNotifications() {
  const context = React.useContext(NotificationSystemContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationSystemContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </NotificationSystemContext.Provider>
  )
}

function NotificationContainer({ 
  notifications, 
  onClose 
}: { 
  notifications: NotificationProps[]
  onClose: (id: string) => void 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: NotificationProps
  onClose: (id: string) => void 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(notification.id), 300)
  }

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-success/20 border-success text-success-foreground'
      case 'error':
        return 'bg-destructive/20 border-destructive text-destructive-foreground'
      case 'reminder':
        return 'bg-slate-800 border-slate-600 text-slate-100'
      default:
        return 'bg-card border-border text-card-foreground'
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="h-5 w-5 animate-success-bounce text-success" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'reminder':
        return <Zap className="h-5 w-5 text-blue-400" />
      default:
        return null
    }
  }

  return (
    <div
      className={`
        min-w-80 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300
        ${getNotificationStyles()}
        ${isVisible && !isExiting ? 'animate-notification-in' : ''}
        ${isExiting ? 'animate-notification-out' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            {notification.type === 'success' && (
              <p className="text-xs opacity-75 mt-1">Recebido via Pix</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}