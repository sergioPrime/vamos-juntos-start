import { useState, useCallback } from 'react'
import { useAnimation } from '@/contexts/AnimationContext'

export type ButtonState = 'idle' | 'loading' | 'success' | 'error'

interface UseButtonAnimationOptions {
  successDuration?: number
  errorDuration?: number
  onSuccess?: () => void
  onError?: () => void
}

export function useButtonAnimation(options: UseButtonAnimationOptions = {}) {
  const { animationsEnabled } = useAnimation()
  const [state, setState] = useState<ButtonState>('idle')
  const { successDuration = 1000, errorDuration = 1000, onSuccess, onError } = options

  const setLoading = useCallback(() => {
    setState('loading')
  }, [])

  const setSuccess = useCallback(() => {
    setState('success')
    onSuccess?.()
    
    if (animationsEnabled) {
      setTimeout(() => {
        setState('idle')
      }, successDuration)
    } else {
      // Immediate reset if animations disabled
      setTimeout(() => setState('idle'), 100)
    }
  }, [animationsEnabled, successDuration, onSuccess])

  const setError = useCallback(() => {
    setState('error')
    onError?.()
    
    if (animationsEnabled) {
      setTimeout(() => {
        setState('idle')
      }, errorDuration)
    } else {
      // Immediate reset if animations disabled
      setTimeout(() => setState('idle'), 100)
    }
  }, [animationsEnabled, errorDuration, onError])

  const reset = useCallback(() => {
    setState('idle')
  }, [])

  const executeAction = useCallback(async (action: () => Promise<void> | void) => {
    try {
      setLoading()
      await action()
      setSuccess()
    } catch (error) {
      setError()
      throw error
    }
  }, [setLoading, setSuccess, setError])

  return {
    state,
    setLoading,
    setSuccess,
    setError,
    reset,
    executeAction,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle'
  }
}