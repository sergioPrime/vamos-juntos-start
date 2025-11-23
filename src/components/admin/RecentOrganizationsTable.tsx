import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RecentOrganizationsTableProps {
  organizations: Array<{
    id: string
    name: string
    created_at: string
    users_count: number
  }>
}

export function RecentOrganizationsTable({ organizations }: RecentOrganizationsTableProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Organizações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Criada há</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{org.users_count}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(org.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
