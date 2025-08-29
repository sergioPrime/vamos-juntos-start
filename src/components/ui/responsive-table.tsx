import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:block">
        {children}
      </div>
      
      {/* Mobile/Tablet view with horizontal scroll */}
      <div className="md:hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px] pb-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}