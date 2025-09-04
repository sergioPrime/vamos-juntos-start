import React, { createContext, useContext, useEffect, useState } from 'react'

interface SidebarConfigContextType {
  clickOnlyMode: boolean
  setClickOnlyMode: (value: boolean) => void
}

const SidebarConfigContext = createContext<SidebarConfigContextType | null>(null)

export function useSidebarConfig() {
  const context = useContext(SidebarConfigContext)
  if (!context) {
    throw new Error('useSidebarConfig must be used within a SidebarConfigProvider')
  }
  return context
}

interface SidebarConfigProviderProps {
  children: React.ReactNode
}

export function SidebarConfigProvider({ children }: SidebarConfigProviderProps) {
  const [clickOnlyMode, setClickOnlyModeState] = useState(() => {
    const saved = localStorage.getItem('sidebar-click-only-mode')
    return saved ? JSON.parse(saved) : false
  })

  const setClickOnlyMode = (value: boolean) => {
    setClickOnlyModeState(value)
    localStorage.setItem('sidebar-click-only-mode', JSON.stringify(value))
  }

  return (
    <SidebarConfigContext.Provider value={{ clickOnlyMode, setClickOnlyMode }}>
      {children}
    </SidebarConfigContext.Provider>
  )
}