import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  action: () => void
  description: string
  preventDefault?: boolean
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    let shortcutKey = ''
    if (ctrl) shortcutKey += 'ctrl+'
    if (alt) shortcutKey += 'alt+'
    if (shift) shortcutKey += 'shift+'
    shortcutKey += key

    // Also check for cmd+ (metaKey)
    const cmdShortcut = shortcutKey.replace('ctrl+', 'cmd+')

    for (const shortcut of shortcuts) {
      const keys = shortcut.key.split(', ')
      if (keys.includes(shortcutKey) || keys.includes(cmdShortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return { shortcuts }
}