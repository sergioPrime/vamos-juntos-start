import { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnimation } from '@/contexts/AnimationContext'
import { cn } from '@/lib/utils'

interface LoadingWrapperProps {
  loading: boolean
  children: ReactNode
  skeleton?: ReactNode
  className?: string
  type?: 'card' | 'list' | 'table' | 'custom'
}

const defaultSkeletons = {
  card: (
    <div className="space-y-4 p-4 border rounded-lg">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  ),
  list: (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  ),
  table: (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  )
}

export function LoadingWrapper({ 
  loading, 
  children, 
  skeleton, 
  className,
  type = 'card'
}: LoadingWrapperProps) {
  const { animationsEnabled } = useAnimation()

  if (loading) {
    const skeletonContent = skeleton || defaultSkeletons[type] || defaultSkeletons.card
    
    return (
      <div className={cn(
        className,
        animationsEnabled && 'animate-pulse'
      )}>
        {skeletonContent}
      </div>
    )
  }

  return (
    <div className={cn(
      className,
      animationsEnabled && 'animate-fade-in'
    )}>
      {children}
    </div>
  )
}