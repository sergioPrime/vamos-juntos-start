import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionMetrics {
  expiredLicenses: number;
  expiresToday: number;
  expiresNext7Days: number;
  totalOrganizations: number;
  totalUsers: number;
}

export function useSubscriptionMetrics() {
  const { data: metrics, isLoading, error } = useQuery<SubscriptionMetrics>({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      // Buscar organizações com assinaturas
      const { data: orgs, error: orgsError } = await supabase
        .from('user_organizations')
        .select('subscription_plan_id, subscription_status, subscription_started_at');

      if (orgsError) throw orgsError;

      // Como não temos data de expiração, vamos simular alguns valores
      // Na implementação real, você deveria ter um campo subscription_end_date
      const expiredLicenses = 0;
      const expiresToday = 0;
      const expiresNext7Days = 0;

      // Contar organizações únicas
      const { count: totalOrganizations, error: countError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Contar usuários
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      return {
        expiredLicenses,
        expiresToday,
        expiresNext7Days,
        totalOrganizations: totalOrganizations || 0,
        totalUsers: totalUsers || 0,
      };
    },
  });

  return {
    metrics: metrics || {
      expiredLicenses: 0,
      expiresToday: 0,
      expiresNext7Days: 0,
      totalOrganizations: 0,
      totalUsers: 0,
    },
    isLoading,
    error,
  };
}
