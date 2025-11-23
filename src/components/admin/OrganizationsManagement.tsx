import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Building2, MoreVertical, Eye, Power, PowerOff, Trash2, Search, Users } from "lucide-react"
import { useOrganizations, OrganizationWithStats } from "@/hooks/useOrganizations"
import { OrganizationDetailsDialog } from "./OrganizationDetailsDialog"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function OrganizationsManagement() {
  const {
    organizations,
    loading,
    toggleOrganizationStatus,
    deleteOrganization,
    getOrganizationDetails
  } = useOrganizations()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orgToDelete, setOrgToDelete] = useState<OrganizationWithStats | null>(null)

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetails = (orgId: string) => {
    setSelectedOrgId(orgId)
    setDetailsDialogOpen(true)
  }

  const handleToggleStatus = async (org: OrganizationWithStats) => {
    await toggleOrganizationStatus(org.id, org.is_active || false)
  }

  const handleDeleteClick = (org: OrganizationWithStats) => {
    setOrgToDelete(org)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!orgToDelete) return
    await deleteOrganization(orgToDelete.id)
    setDeleteDialogOpen(false)
    setOrgToDelete(null)
  }

  const getStatusBadge = (org: OrganizationWithStats) => {
    if (!org.is_active) {
      return <Badge variant="destructive">Suspensa</Badge>
    }
    if (org.subscription_status === 'active') {
      return <Badge variant="default">Ativa</Badge>
    }
    if (org.subscription_status === 'trial') {
      return <Badge variant="secondary">Trial</Badge>
    }
    return <Badge variant="outline">Sem assinatura</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Empresas</CardTitle>
          <CardDescription>Carregando organizações...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestão de Empresas
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todas as organizações do sistema
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {organizations.length} organizações
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, slug ou email do proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredOrganizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhuma organização encontrada com os filtros aplicados'
                  : 'Nenhuma organização cadastrada no sistema'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{org.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-mono">{org.owner_email || 'Sem proprietário'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{org.users_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.plan_name ? (
                          <Badge variant="outline">{org.plan_name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem plano</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(org)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(org.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(org.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(org)}>
                              {org.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Suspender
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(org)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <OrganizationDetailsDialog
        organizationId={selectedOrgId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        getDetails={getOrganizationDetails}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a organização "{orgToDelete?.name}"?
              {orgToDelete && orgToDelete.users_count > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta organização possui {orgToDelete.users_count} usuário(s) e não poderá ser excluída. 
                  Suspenda-a ao invés disso.
                </span>
              )}
              {orgToDelete && orgToDelete.users_count === 0 && (
                <span className="block mt-2 font-medium">
                  Esta ação não pode ser desfeita.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={orgToDelete ? orgToDelete.users_count > 0 : false}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
