import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays, 
  addDays, 
  subWeeks, 
  addWeeks, 
  subMonths, 
  addMonths,
  previousMonday,
  nextFriday
} from "date-fns"
import { ptBR } from "date-fns/locale"

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface PeriodOption {
  value: string
  label: string
  isCustom?: boolean
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "custom", label: "Personalizado", isCustom: true },
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "this_week_sun", label: "Esta Semana (dom. até sáb.)" },
  { value: "this_week_mon", label: "Esta Semana (seg. até dom.)" },
  { value: "next_week", label: "Próxima Semana" },
  { value: "last_7_days", label: "Últimos 7 Dias" },
  { value: "last_week_sun", label: "Semana Passada (dom. até sáb.)" },
  { value: "last_business_week", label: "Última Semana Útil (seg. até sex.)" },
  { value: "last_14_days", label: "Últimos 14 Dias" },
  { value: "this_month", label: "Este Mês" },
  { value: "next_month", label: "Próximo Mês" },
  { value: "last_30_days", label: "Últimos 30 Dias" },
  { value: "last_month", label: "Mês Passado" }
]

export function calculateDateRange(periodType: string): DateRange | null {
  const today = new Date()
  
  switch (periodType) {
    case "today":
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today)
      }
      
    case "yesterday":
      const yesterday = subDays(today, 1)
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      }
      
    case "tomorrow":
      const tomorrow = addDays(today, 1)
      return {
        startDate: startOfDay(tomorrow),
        endDate: endOfDay(tomorrow)
      }
      
    case "this_week_sun":
      return {
        startDate: startOfWeek(today, { weekStartsOn: 0 }), // Sunday
        endDate: endOfWeek(today, { weekStartsOn: 0 })
      }
      
    case "this_week_mon":
      return {
        startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday
        endDate: endOfWeek(today, { weekStartsOn: 1 })
      }
      
    case "next_week":
      const nextWeek = addWeeks(today, 1)
      return {
        startDate: startOfWeek(nextWeek, { weekStartsOn: 1 }),
        endDate: endOfWeek(nextWeek, { weekStartsOn: 1 })
      }
      
    case "last_7_days":
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today)
      }
      
    case "last_week_sun":
      const lastWeek = subWeeks(today, 1)
      return {
        startDate: startOfWeek(lastWeek, { weekStartsOn: 0 }),
        endDate: endOfWeek(lastWeek, { weekStartsOn: 0 })
      }
      
    case "last_business_week":
      const lastBusinessWeek = subWeeks(today, 1)
      const monday = previousMonday(endOfWeek(lastBusinessWeek))
      const friday = nextFriday(monday)
      return {
        startDate: startOfDay(monday),
        endDate: endOfDay(friday)
      }
      
    case "last_14_days":
      return {
        startDate: startOfDay(subDays(today, 13)),
        endDate: endOfDay(today)
      }
      
    case "this_month":
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today)
      }
      
    case "next_month":
      const nextMonth = addMonths(today, 1)
      return {
        startDate: startOfMonth(nextMonth),
        endDate: endOfMonth(nextMonth)
      }
      
    case "last_30_days":
      return {
        startDate: startOfDay(subDays(today, 29)),
        endDate: endOfDay(today)
      }
      
    case "last_month":
      const lastMonth = subMonths(today, 1)
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      }
      
    default:
      return null
  }
}

export function validateDateRange(startDate?: Date, endDate?: Date): string | null {
  if (!startDate || !endDate) return null
  
  if (startDate > endDate) {
    return "A data inicial não pode ser maior que a data final."
  }
  
  return null
}