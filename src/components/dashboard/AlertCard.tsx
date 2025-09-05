import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  icon: React.ReactNode
  actionLabel?: string
  actionRoute?: string
  onResolve: (id: string) => void
  className?: string
}

export function AlertCard({
  id,
  title,
  description,
  severity,
  icon,
  actionLabel,
  actionRoute,
  onResolve,
  className
}: AlertCardProps) {
  const navigate = useNavigate()

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          card: 'border-destructive bg-destructive/5',
          badge: 'bg-destructive text-destructive-foreground',
          icon: 'text-destructive'
        }
      case 'high':
        return {
          card: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
          badge: 'bg-orange-500 text-white',
          icon: 'text-orange-500'
        }
      case 'medium':
        return {
          card: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
          badge: 'bg-yellow-500 text-white',
          icon: 'text-yellow-600'
        }
      case 'low':
        return {
          card: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
          badge: 'bg-blue-500 text-white',
          icon: 'text-blue-500'
        }
      default:
        return {
          card: 'border-muted',
          badge: 'bg-muted text-muted-foreground',
          icon: 'text-muted-foreground'
        }
    }
  }

  const styles = getSeverityStyles(severity)

  const handleAction = () => {
    if (actionRoute) {
      navigate(actionRoute)
    }
  }

  return (
    <Card className={cn(
      "relative transition-all duration-200 hover:shadow-lg",
      styles.card,
      className
    )}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/80"
        onClick={() => onResolve(id)}
      >
        <X className="h-3 w-3" />
      </Button>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", styles.icon)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-none">{title}</h3>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", styles.badge)}
              >
                {severity.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        {actionLabel && actionRoute && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between p-2 h-auto"
            onClick={handleAction}
          >
            <span className="text-xs">{actionLabel}</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}