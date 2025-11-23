import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RecentOrganization } from '@/hooks/useAdminAnalytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentOrganizationsTableProps {
  organizations: RecentOrganization[];
}

export function RecentOrganizationsTable({ organizations }: RecentOrganizationsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizações Recentes</CardTitle>
        <CardDescription>Últimas organizações cadastradas</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma organização encontrada
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.plan_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {org.subscription_status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
