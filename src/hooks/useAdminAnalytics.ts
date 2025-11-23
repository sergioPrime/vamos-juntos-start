import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalUsers: number;
  mrr: number;
  orgGrowth: number;
  subscriptionGrowth: number;
  userGrowth: number;
  mrrGrowth: number;
}

export interface PlanDistribution {
  plan_name: string;
  count: number;
  [key: string]: any;
}

export interface RecentOrganization {
  id: string;
  name: string;
  created_at: string;
  subscription_status: string;
  plan_name: string;
}

export function useAdminAnalytics() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async (): Promise<AdminMetrics> => {
      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return {
        totalOrganizations: totalOrgs || 0,
        activeSubscriptions: 0,
        totalUsers: activeUsers || 0,
        mrr: 0,
        orgGrowth: 0,
        subscriptionGrowth: 0,
        userGrowth: 0,
        mrrGrowth: 0,
      };
    },
  });

  const { data: planDistribution = [], isLoading: planLoading } = useQuery({
    queryKey: ['plan-distribution'],
    queryFn: async (): Promise<PlanDistribution[]> => {
      return [];
    },
  });

  const { data: recentOrgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['recent-organizations'],
    queryFn: async (): Promise<RecentOrganization[]> => {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []).map((org) => ({
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        subscription_status: 'active',
        plan_name: 'Free',
      }));
    },
  });

  return {
    metrics: metrics || {
      totalOrganizations: 0,
      activeSubscriptions: 0,
      totalUsers: 0,
      mrr: 0,
      orgGrowth: 0,
      subscriptionGrowth: 0,
      userGrowth: 0,
      mrrGrowth: 0,
    },
    planDistribution,
    recentOrgs,
    isLoading: metricsLoading || planLoading || orgsLoading,
  };
}
