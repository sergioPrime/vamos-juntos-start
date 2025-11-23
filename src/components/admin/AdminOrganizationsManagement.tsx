import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Building2, Users, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrganizationWithMetrics {
  id: string;
  name: string;
  created_at: string;
  subscription_plan_id: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  user_count: number;
  plan_name: string | null;
}

export function AdminOrganizationsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-organizations', searchTerm, planFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_organizations')
        .select(`
          org_id,
          subscription_plan_id,
          subscription_status,
          subscription_started_at,
          organizations(id, name, created_at),
          subscription_plans(name)
        `)
        .order('created_at', { ascending: false });

      if (planFilter !== 'all') {
        query = query.eq('subscription_plan_id', planFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count users per organization
      const orgIds = data?.map((uo: any) => uo.org_id) || [];
      const { data: userCounts } = await supabase
        .from('user_organizations')
        .select('org_id')
        .in('org_id', orgIds);

      const countByOrg = userCounts?.reduce((acc: any, item: any) => {
        acc[item.org_id] = (acc[item.org_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const filtered = searchTerm
        ? data?.filter((uo: any) =>
            uo.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;

      return filtered?.map((uo: any) => ({
        id: uo.organizations?.id || uo.org_id,
        name: uo.organizations?.name || 'N/A',
        created_at: uo.organizations?.created_at || new Date().toISOString(),
        subscription_plan_id: uo.subscription_plan_id,
        subscription_status: uo.subscription_status,
        subscription_start_date: uo.subscription_started_at,
        subscription_end_date: null,
        user_count: countByOrg?.[uo.org_id] || 0,
        plan_name: uo.subscription_plans?.name || null,
      })) as OrganizationWithMetrics[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  const suspendOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from('user_organizations')
        .update({ subscription_status: 'suspended' })
        .eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organização suspensa com sucesso');
    },
    onError: () => {
      toast.error('Erro ao suspender organização');
    },
  });

  const getSubscriptionBadge = (status: string | null) => {
    if (!status) {
      return <Badge variant="outline">Sem Plano</Badge>;
    }

    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Ativo' },
      inactive: { variant: 'destructive', label: 'Inativo' },
      suspended: { variant: 'secondary', label: 'Suspenso' },
      trial: { variant: 'outline', label: 'Trial' },
    };

    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;

    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return <span className="text-destructive">Expirado</span>;
    if (diff <= 7) return <span className="text-orange-500">{diff} dias</span>;
    return <span className="text-muted-foreground">{diff} dias</span>;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Organizações</h2>
          <p className="text-muted-foreground">
            Gerencie todas as organizações e suas licenças
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Planos</SelectItem>
              {plans?.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : organizations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma organização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                organizations?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>{org.plan_name || 'Sem plano'}</TableCell>
                    <TableCell>
                      {getSubscriptionBadge(org.subscription_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.user_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDaysRemaining(org.subscription_end_date) || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(org.created_at), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Renovar Licença
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => suspendOrgMutation.mutate(org.id)}
                          >
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {organizations && organizations.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {organizations.length} organização(ões)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
