import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Users, FileText, Package, ShoppingCart, CalendarDays } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrganizationDetailsDialogProps {
  organizationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getDetails: (orgId: string) => Promise<any>
}

export function OrganizationDetailsDialog({
  organizationId,
  open,
  onOpenChange,
  getDetails
}: OrganizationDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    if (organizationId && open) {
      loadDetails()
    }
  }, [organizationId, open])

  const loadDetails = async () => {
    if (!organizationId) return

    setLoading(true)
    const data = await getDetails(organizationId)
    setDetails(data)
    setLoading(false)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Administrador',
      user: 'Usuário'
    }
    return labels[role] || role
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalhes da Organização
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e estatísticas de uso
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{details.organization.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Slug: {details.organization.slug}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada {formatDistanceToNow(new Date(details.organization.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  <Badge variant={details.organization.is_active ? "default" : "destructive"}>
                    {details.organization.is_active ? "Ativa" : "Suspensa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{details.stats.financial_entries}</span>
                    <span className="text-xs text-muted-foreground">Lançamentos</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <Package className="h-5 w-5 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{details.stats.products}</span>
                    <span className="text-xs text-muted-foreground">Produtos</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <ShoppingCart className="h-5 w-5 mb-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">{details.stats.customers}</span>
                    <span className="text-xs text-muted-foreground">Clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="users" className="w-full">
              <TabsList>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários ({details.users.length})
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Building2 className="h-4 w-4 mr-2" />
                  Informações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuários da Organização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.users.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Adicionado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.users.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                {user.profiles?.first_name || user.profiles?.last_name
                                  ? `${user.profiles.first_name || ''} ${user.profiles.last_name || ''}`.trim()
                                  : 'Sem nome'}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {user.profiles?.email || 'Sem email'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                  {getRoleLabel(user.role)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(user.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Técnicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ID</p>
                        <p className="font-mono text-sm">{details.organization.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Slug</p>
                        <p className="font-mono text-sm">{details.organization.slug}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Criada em</p>
                        <p className="text-sm flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(details.organization.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Atualizada em</p>
                        <p className="text-sm flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(details.organization.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Não foi possível carregar os detalhes da organização
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
