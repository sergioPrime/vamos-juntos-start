import { ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { useAnimation } from '@/contexts/AnimationContext'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  position?: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center'
}

const toastIcons = {
  success: CheckCircle,
  error: X,
  warning: AlertTriangle,
  info: AlertCircle
}

const toastDurations = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
}

export function useAnimatedToast() {
  const { animationsEnabled } = useAnimation()

  const showToast = (options: ToastOptions) => {
    const { type, title, description, duration, action } = options
    const Icon = toastIcons[type]
    const defaultDuration = duration || toastDurations[type]

    const toastContent = (
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
          type === 'success' ? 'text-green-600' :
          type === 'error' ? 'text-red-600' :
          type === 'warning' ? 'text-yellow-600' :
          'text-blue-600'
        }`} />
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {description && (
            <div className="text-sm text-muted-foreground mt-1">{description}</div>
          )}
        </div>
      </div>
    )

    const toastOptions = {
      duration: defaultDuration,
      className: animationsEnabled ? 'animate-slide-in-right' : '',
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    }

    switch (type) {
      case 'success':
        sonnerToast.success(toastContent, toastOptions)
        break
      case 'error':
        sonnerToast.error(toastContent, toastOptions)
        break
      case 'warning':
        sonnerToast.warning(toastContent, toastOptions)
        break
      case 'info':
      default:
        sonnerToast(toastContent, toastOptions)
        break
    }
  }

  const showSuccess = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    showToast({ type: 'success', title, description, ...options })
  }

  const showError = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    showToast({ type: 'error', title, description, ...options })
  }

  const showWarning = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    showToast({ type: 'warning', title, description, ...options })
  }

  const showInfo = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    showToast({ type: 'info', title, description, ...options })
  }

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}