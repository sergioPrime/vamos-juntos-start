import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  user_count: number;
  created_at: string;
  subscription_status: string;
}

interface RecentOrganizationsTableProps {
  organizations?: Organization[];
}

export function RecentOrganizationsTable({ organizations }: RecentOrganizationsTableProps) {
  const orgs = organizations && organizations.length > 0 
    ? organizations 
    : [
        { id: '1', name: 'Empresa A', user_count: 15, created_at: new Date().toISOString(), subscription_status: 'active' },
        { id: '2', name: 'Empresa B', user_count: 12, created_at: new Date().toISOString(), subscription_status: 'active' },
        { id: '3', name: 'Empresa C', user_count: 8, created_at: new Date().toISOString(), subscription_status: 'trial' },
      ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-600">Trial</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (orgs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma organização encontrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organização</TableHead>
          <TableHead className="text-center">Usuários</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Criado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orgs.map((org) => (
          <TableRow key={org.id}>
            <TableCell className="font-medium">{org.name}</TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>{org.user_count}</span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(org.subscription_status)}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(org.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
