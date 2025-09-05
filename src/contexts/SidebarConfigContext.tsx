import React, { createContext, useContext, useEffect, useState } from 'react'

interface SidebarConfigContextType {
  clickOnlyMode: boolean
  setClickOnlyMode: (value: boolean) => void
  lockNumberFields: boolean
  setLockNumberFields: (value: boolean) => void
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

  const [lockNumberFields, setLockNumberFieldsState] = useState(() => {
    const saved = localStorage.getItem('lock-number-fields')
    return saved ? JSON.parse(saved) : false
  })

  const setClickOnlyMode = (value: boolean) => {
    setClickOnlyModeState(value)
    localStorage.setItem('sidebar-click-only-mode', JSON.stringify(value))
  }

  const setLockNumberFields = (value: boolean) => {
    setLockNumberFieldsState(value)
    localStorage.setItem('lock-number-fields', JSON.stringify(value))
  }

  return (
    <SidebarConfigContext.Provider value={{ 
      clickOnlyMode, 
      setClickOnlyMode,
      lockNumberFields,
      setLockNumberFields
    }}>
      {children}
    </SidebarConfigContext.Provider>
  )
}