import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'

interface SubscriptionInfo {
  subscribed: boolean
  subscription_plan_id: string | null
  subscription_status: string
  subscription_end: string | null
  isExpired: boolean
  daysUntilExpiration: number | null
  showExpirationAlert: boolean
}

interface SubscriptionContextType extends SubscriptionInfo {
  loading: boolean
  checkSubscription: () => Promise<void>
  isSubscriptionActive: () => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  subscription_plan_id: null,
  subscription_status: 'inactive',
  subscription_end: null,
  isExpired: false,
  daysUntilExpiration: null,
  showExpirationAlert: false,
  loading: true,
  checkSubscription: async () => {},
  isSubscriptionActive: () => false
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    subscribed: false,
    subscription_plan_id: null,
    subscription_status: 'inactive',
    subscription_end: null,
    isExpired: false,
    daysUntilExpiration: null,
    showExpirationAlert: false
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const calculateExpirationInfo = (subscriptionEnd: string | null) => {
    if (!subscriptionEnd) {
      return {
        isExpired: false,
        daysUntilExpiration: null,
        showExpirationAlert: false
      }
    }

    const endDate = new Date(subscriptionEnd)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isExpired = diffDays <= 0
    const showExpirationAlert = diffDays > 0 && diffDays <= 5

    return {
      isExpired,
      daysUntilExpiration: diffDays > 0 ? diffDays : null,
      showExpirationAlert
    }
  }

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionInfo({
        subscribed: false,
        subscription_plan_id: null,
        subscription_status: 'inactive',
        subscription_end: null,
        isExpired: false,
        daysUntilExpiration: null,
        showExpirationAlert: false
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) throw error
      
      if (data) {
        const expirationInfo = calculateExpirationInfo(data.subscription_end)
        
        setSubscriptionInfo({
          subscribed: data.subscribed && !expirationInfo.isExpired,
          subscription_plan_id: data.subscription_plan_id,
          subscription_status: expirationInfo.isExpired ? 'expired' : data.subscription_status,
          subscription_end: data.subscription_end,
          ...expirationInfo
        })

        // Show expiration alert if needed
        if (expirationInfo.showExpirationAlert && data.subscribed) {
          toast.warning(
            `⚠️ Sua assinatura expira em ${expirationInfo.daysUntilExpiration} dia(s)!`, 
            {
              duration: 8000,
              action: {
                label: 'Renovar Agora',
                onClick: () => {
                  window.location.href = '/settings?tab=planos'
                }
              }
            }
          )
        }

        // Block access if expired
        if (expirationInfo.isExpired && data.subscribed) {
          toast.error('Sua assinatura expirou! Renove para continuar usando o sistema.', {
            duration: 10000,
            action: {
              label: 'Renovar Agora',
              onClick: () => {
                window.location.href = '/settings?tab=planos'
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error)
      setSubscriptionInfo({
        subscribed: false,
        subscription_plan_id: null,
        subscription_status: 'error',
        subscription_end: null,
        isExpired: false,
        daysUntilExpiration: null,
        showExpirationAlert: false
      })
    } finally {
      setLoading(false)
    }
  }

  const isSubscriptionActive = () => {
    return subscriptionInfo.subscribed && !subscriptionInfo.isExpired
  }

  useEffect(() => {
    checkSubscription()
  }, [user, currentOrg])

  // Check subscription status every 10 minutes
  useEffect(() => {
    const interval = setInterval(checkSubscription, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <SubscriptionContext.Provider value={{
      ...subscriptionInfo,
      loading,
      checkSubscription,
      isSubscriptionActive
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}