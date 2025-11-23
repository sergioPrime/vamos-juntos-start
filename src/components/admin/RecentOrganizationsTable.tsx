import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Building2, Users } from "lucide-react"

interface RecentOrganizationsTableProps {
  organizations: {
    id: string
    name: string
    created_at: string
    plan_name: string
    status: string
    members_count: number
  }[]
}

export function RecentOrganizationsTable({ organizations }: RecentOrganizationsTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'trialing':
        return 'secondary'
      case 'canceled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'trialing':
        return 'Trial'
      case 'canceled':
        return 'Cancelado'
      case 'past_due':
        return 'Vencido'
      default:
        return 'Inativo'
    }
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Organizações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {organizations.map((org) => (
            <div 
              key={org.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{org.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(org.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {org.members_count} {org.members_count === 1 ? 'membro' : 'membros'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{org.plan_name}</p>
                </div>
                <Badge variant={getStatusVariant(org.status)}>
                  {getStatusLabel(org.status)}
                </Badge>
              </div>
            </div>
          ))}

          {organizations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma organização encontrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
