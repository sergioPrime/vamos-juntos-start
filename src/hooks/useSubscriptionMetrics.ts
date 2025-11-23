import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export function useSubscriptionMetrics() {
  return useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      const today = new Date()
      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)
      const next7Days = addDays(today, 7)

      // Licenças vencidas
      const { data: expired, error: expiredError } = await supabase
        .from('subscriptions')
        .select('*, organizations(name)')
        .lt('expiration_date', todayStart.toISOString())
        .eq('status', 'active')

      if (expiredError) throw expiredError

      // Licenças vencendo hoje
      const { data: expiringToday, error: todayError } = await supabase
        .from('subscriptions')
        .select('*, organizations(name)')
        .gte('expiration_date', todayStart.toISOString())
        .lte('expiration_date', todayEnd.toISOString())
        .eq('status', 'active')

      if (todayError) throw todayError

      // Licenças vencendo nos próximos 7 dias
      const { data: expiringNext7Days, error: next7Error } = await supabase
        .from('subscriptions')
        .select('*, organizations(name)')
        .gt('expiration_date', todayEnd.toISOString())
        .lte('expiration_date', next7Days.toISOString())
        .eq('status', 'active')

      if (next7Error) throw next7Error

      // Total de organizações ativas
      const { count: totalOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      if (orgsError) throw orgsError

      // Total de usuários
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      return {
        expired: expired || [],
        expiringToday: expiringToday || [],
        expiringNext7Days: expiringNext7Days || [],
        totalOrganizations: totalOrgs || 0,
        totalUsers: totalUsers || 0,
      }
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  })
}
