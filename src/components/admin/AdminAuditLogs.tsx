import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Search, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  user_email: string | null;
  created_at: string;
  metadata: any;
  ip_address: string | null;
}

export function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', searchTerm, actionFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      create: { variant: 'default', label: 'Criar', color: 'text-green-500' },
      update: { variant: 'secondary', label: 'Atualizar', color: 'text-blue-500' },
      delete: { variant: 'destructive', label: 'Excluir', color: 'text-red-500' },
      view: { variant: 'outline', label: 'Visualizar', color: 'text-gray-500' },
      login: { variant: 'outline', label: 'Login', color: 'text-purple-500' },
    };

    const config = variants[action.toLowerCase()] || { variant: 'outline', label: action, color: 'text-gray-500' };
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      subscription: 'Assinatura',
      organization: 'Organização',
      user: 'Usuário',
      plan: 'Plano',
      license: 'Licença',
      settings: 'Configurações',
    };

    return labels[entityType.toLowerCase()] || entityType;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
          <p className="text-muted-foreground">
            Visualize todas as ações administrativas do sistema
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="create">Criar</SelectItem>
              <SelectItem value="update">Atualizar</SelectItem>
              <SelectItem value="delete">Excluir</SelectItem>
              <SelectItem value="view">Visualizar</SelectItem>
              <SelectItem value="login">Login</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="subscription">Assinatura</SelectItem>
              <SelectItem value="organization">Organização</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="plan">Plano</SelectItem>
              <SelectItem value="license">Licença</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(log.created_at), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm:ss', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user_email || 'Sistema'}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {getEntityLabel(log.entity_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.ip_address || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {logs && logs.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando os últimos {logs.length} logs
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
