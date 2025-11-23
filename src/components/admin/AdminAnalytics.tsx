import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

export function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const now = new Date()
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i)
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString(),
        }
      })

      // Novos usuários por mês
      const usersByMonth = await Promise.all(
        last6Months.map(async ({ month, start, end }) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end)

          return { month, users: count || 0 }
        })
      )

      // Novas organizações por mês
      const orgsByMonth = await Promise.all(
        last6Months.map(async ({ month, start, end }) => {
          const { count } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end)

          return { month, organizations: count || 0 }
        })
      )

      // Distribuição por planos
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('status', 'active')

      const planDistribution = subscriptions?.reduce((acc: any, sub) => {
        const plan = sub.plan_type || 'free'
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      }, {})

      const planData = Object.entries(planDistribution || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))

      // Taxa de crescimento
      const currentMonthUsers = Number(usersByMonth[usersByMonth.length - 1]?.users) || 0
      const lastMonthUsers = Number(usersByMonth[usersByMonth.length - 2]?.users) || 0
      const growthRate = lastMonthUsers > 0 
        ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
        : 0

      return {
        usersByMonth,
        orgsByMonth,
        planData,
        growthRate: Math.round(growthRate * 10) / 10,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Taxa de Crescimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            {analytics?.growthRate && analytics.growthRate > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${analytics?.growthRate && analytics.growthRate > 0 ? 'text-green-500' : 'text-destructive'}`}>
              {analytics?.growthRate > 0 ? '+' : ''}{analytics?.growthRate}%
            </span>
            <span className="text-sm text-muted-foreground">
              vs. mês anterior
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Novos Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Novos Usuários</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics?.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Novas Organizações */}
        <Card>
          <CardHeader>
            <CardTitle>Novas Organizações</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics?.orgsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="organizations" 
                  fill="hsl(var(--chart-2))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Planos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Planos</CardTitle>
            <p className="text-sm text-muted-foreground">Planos ativos</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics?.planData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {analytics?.planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
