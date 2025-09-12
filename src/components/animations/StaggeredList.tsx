import { ReactNode, Children, cloneElement, isValidElement } from 'react'
import { useAnimation } from '@/contexts/AnimationContext'
import { cn } from '@/lib/utils'

interface StaggeredListProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

export function StaggeredList({ 
  children, 
  delay = 100, 
  duration = 300,
  className,
  direction = 'up'
}: StaggeredListProps) {
  const { animationsEnabled } = useAnimation()

  if (!animationsEnabled) {
    return <div className={className}>{children}</div>
  }

  const childrenArray = Children.toArray(children)

  const getAnimationClass = (index: number) => {
    const animationDelay = `${index * delay}ms`
    const animationDuration = `${duration}ms`
    
    const directionClasses = {
      up: 'animate-slide-up',
      down: 'animate-slide-down', 
      left: 'animate-slide-in-left',
      right: 'animate-slide-in-right',
      fade: 'animate-fade-in'
    }

    return cn(
      'opacity-0',
      directionClasses[direction],
      'animation-fill-forwards'
    )
  }

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child, {
            key: child.key || index,
            className: cn(
              (child.props as any).className,
              getAnimationClass(index)
            ),
            style: {
              ...(child.props as any).style,
              animationDelay: `${index * delay}ms`,
              animationDuration: `${duration}ms`
            }
          } as any)
        }
        
        return (
          <div
            key={index}
            className={getAnimationClass(index)}
            style={{
              animationDelay: `${index * delay}ms`,
              animationDuration: `${duration}ms`
            }}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}