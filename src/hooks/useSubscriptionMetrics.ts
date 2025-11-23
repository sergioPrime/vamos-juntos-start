import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { startOfToday, endOfToday, addDays, startOfDay, endOfDay } from "date-fns"

interface SubscriptionMetrics {
  expired: number
  expiringToday: number
  expiringNext7Days: number
}

export function useSubscriptionMetrics() {
  return useQuery({
    queryKey: ["subscription-metrics"],
    queryFn: async (): Promise<SubscriptionMetrics> => {
      const today = new Date()
      const todayStart = startOfToday()
      const todayEnd = endOfToday()
      const next7Days = startOfDay(addDays(today, 7))

      // Licenças vencidas (antes de hoje)
      const { count: expiredCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .lt("expiration_date", todayStart.toISOString())
        .eq("status", "active")

      // Licenças vencendo hoje
      const { count: expiringTodayCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gte("expiration_date", todayStart.toISOString())
        .lte("expiration_date", todayEnd.toISOString())
        .eq("status", "active")

      // Licenças vencendo nos próximos 7 dias (não incluindo hoje)
      const { count: expiringNext7DaysCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .gt("expiration_date", todayEnd.toISOString())
        .lte("expiration_date", next7Days.toISOString())
        .eq("status", "active")

      return {
        expired: expiredCount || 0,
        expiringToday: expiringTodayCount || 0,
        expiringNext7Days: expiringNext7DaysCount || 0,
      }
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  })
}
