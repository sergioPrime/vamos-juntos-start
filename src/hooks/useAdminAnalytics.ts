import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface AdminAnalytics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
  revenue: {
    monthly: number;
    total: number;
  };
  growth: {
    organizations: number;
    users: number;
    revenue: number;
  };
  planDistribution: {
    plan_name: string;
    count: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  topOrganizations: {
    id: string;
    name: string;
    user_count: number;
    created_at: string;
    subscription_status: string;
  }[];
  systemHealth: {
    totalAuditLogs: number;
    totalNotifications: number;
    unreadNotifications: number;
    recentActivity: number;
  };
}

export function useAdminAnalytics() {
  const { isSuperAdmin } = useSuperAdmin();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const currentMonth = new Date();
      const lastMonth = subMonths(currentMonth, 1);
      const startOfCurrentMonth = startOfMonth(currentMonth);
      const startOfLastMonth = startOfMonth(lastMonth);

      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, created_at');

      if (orgsError) throw orgsError;

      const totalOrgs = orgs?.length || 0;
      const activeOrgs = Math.floor(totalOrgs * 0.75); // Mock 75% active

      // Organizations created this month
      const orgsThisMonth = orgs?.filter(o => 
        new Date(o.created_at) >= startOfCurrentMonth
      ).length || 0;

      // Organizations created last month
      const orgsLastMonth = orgs?.filter(o => 
        new Date(o.created_at) >= startOfLastMonth && 
        new Date(o.created_at) < startOfCurrentMonth
      ).length || 0;

      // Fetch users via profiles
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Users created this month
      const { count: usersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfCurrentMonth.toISOString());

      // Users created last month
      const { count: usersLastMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfCurrentMonth.toISOString());

      // Mock subscription plans distribution
      const planDistribution = [
        { plan_name: 'free', count: Math.floor(totalOrgs * 0.4) },
        { plan_name: 'basic', count: Math.floor(totalOrgs * 0.3) },
        { plan_name: 'pro', count: Math.floor(totalOrgs * 0.2) },
        { plan_name: 'enterprise', count: Math.floor(totalOrgs * 0.1) },
      ];

      // Fetch user counts per organization
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('org_id');

      const orgUserCounts = (userOrgs || []).reduce((acc: Record<string, number>, uo) => {
        acc[uo.org_id] = (acc[uo.org_id] || 0) + 1;
        return acc;
      }, {});

      // Top organizations by user count
      const topOrganizations = (orgs || [])
        .map(org => ({
          id: org.id,
          name: org.name,
          user_count: orgUserCounts[org.id] || 0,
          created_at: org.created_at,
          subscription_status: 'active', // Mock
        }))
        .sort((a, b) => b.user_count - a.user_count)
        .slice(0, 5);

      // System health metrics
      const { count: totalAuditLogs } = await supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true });

      const { count: totalNotifications } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true });

      const { count: unreadNotifications } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      const { count: recentActivity } = await supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', subMonths(new Date(), 1).toISOString());

      // Monthly revenue (last 6 months)
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentMonth, i);
        monthlyRevenue.push({
          month: format(month, 'MMM yyyy'),
          revenue: Math.random() * 50000 + 10000, // Mock data
        });
      }

      // Calculate growth percentages
      const orgGrowth = orgsLastMonth > 0 
        ? ((orgsThisMonth - orgsLastMonth) / orgsLastMonth) * 100 
        : 0;
      
      const userGrowth = (usersLastMonth || 0) > 0 
        ? (((usersThisMonth || 0) - (usersLastMonth || 0)) / (usersLastMonth || 0)) * 100 
        : 0;

      const analytics: AdminAnalytics = {
        totalOrganizations: totalOrgs,
        activeOrganizations: activeOrgs,
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeOrgs,
        revenue: {
          monthly: monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0,
          total: monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0),
        },
        growth: {
          organizations: Math.round(orgGrowth * 10) / 10,
          users: Math.round(userGrowth * 10) / 10,
          revenue: 15.2, // Mock
        },
        planDistribution,
        monthlyRevenue,
        topOrganizations,
        systemHealth: {
          totalAuditLogs: totalAuditLogs || 0,
          totalNotifications: totalNotifications || 0,
          unreadNotifications: unreadNotifications || 0,
          recentActivity: recentActivity || 0,
        },
      };

      return analytics;
    },
    enabled: isSuperAdmin,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    analytics,
    isLoading,
  };
}
