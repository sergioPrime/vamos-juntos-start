import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function AdminAnalytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [usersResult, orgsResult, plansResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('organizations')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('user_organizations')
          .select('subscription_plan_id, subscription_plans(name)')
          .not('subscription_plan_id', 'is', null),
      ]);

      if (usersResult.error || orgsResult.error || plansResult.error) {
        throw new Error('Erro ao buscar dados de analytics');
      }

      const monthlyUsers = usersResult.data?.reduce((acc: any, user) => {
        const month = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyOrgs = orgsResult.data?.reduce((acc: any, org) => {
        const month = new Date(org.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.keys(monthlyUsers || {}).map((month) => ({
        month,
        users: monthlyUsers[month] || 0,
        organizations: monthlyOrgs[month] || 0,
      }));

      const planDistribution = plansResult.data?.reduce((acc: any, item: any) => {
        const planName = item.subscription_plans?.name || 'Sem Plano';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.keys(planDistribution || {}).map((key) => ({
        name: key,
        value: planDistribution[key],
      }));

      const currentMonthUsers = usersResult.data?.filter(
        (u) => new Date(u.created_at).getMonth() === new Date().getMonth()
      ).length || 0;

      const lastMonthUsers = usersResult.data?.filter((u) => {
        const date = new Date(u.created_at);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return date.getMonth() === lastMonth.getMonth();
      }).length || 0;

      const growthRate = lastMonthUsers > 0 ? Number(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;

      return {
        chartData,
        pieData,
        growthRate,
        currentMonthUsers,
      };
    },
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Crescimento Mensal</h3>
            <p className="text-sm text-muted-foreground">Novos usuários e organizações</p>
          </div>

          <div className="flex items-center gap-2">
            {analyticsData?.growthRate && analyticsData.growthRate > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <span className={analyticsData?.growthRate && analyticsData.growthRate > 0 ? 'text-green-500' : 'text-destructive'}>
              {Math.abs(analyticsData?.growthRate || 0).toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">vs. mês anterior</span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="hsl(var(--primary))" name="Usuários" />
              <Bar dataKey="organizations" fill="hsl(var(--secondary))" name="Organizações" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Distribuição de Planos</h3>
            <p className="text-sm text-muted-foreground">Assinaturas ativas por plano</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.pieData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {analyticsData?.pieData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {analyticsData?.pieData?.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
