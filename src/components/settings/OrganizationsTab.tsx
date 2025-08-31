import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Building2, Eye, Edit } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editOrgName, setEditOrgName] = useState('')
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin()

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar organizações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async () => {
    if (!newOrgName.trim() || !user) return

    console.log('Creating organization...', { name: newOrgName.trim(), user: user?.id })
    setCreating(true)
    try {
      const slug = newOrgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      console.log('Calling RPC with:', { org_name: newOrgName.trim(), org_slug: slug })
      
      const { data, error } = await supabase.rpc('create_organization_with_owner', {
        org_name: newOrgName.trim(),
        org_slug: slug
      })

      console.log('RPC response:', { data, error })

      if (error) {
        console.error('RPC error details:', error)
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Organização criada com sucesso"
      })

      setNewOrgName('')
      setIsDialogOpen(false)
      loadOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      toast({
        title: "Erro",
        description: "Erro ao criar organização",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org)
    setEditOrgName(org.name)
    setIsEditDialogOpen(true)
  }

  const updateOrganization = async () => {
    if (!editingOrg || !editOrgName.trim() || !user) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: editOrgName.trim() })
        .eq('id', editingOrg.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Organização atualizada com sucesso"
      })

      setEditOrgName('')
      setEditingOrg(null)
      setIsEditDialogOpen(false)
      loadOrganizations()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar organização",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  if (loading || superAdminLoading) {
    return <div className="text-center">Carregando organizações...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Empresas Cadastradas</h3>
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createOrganization} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit Organization Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSuperAdmin ? 'Editar Empresa' : 'Visualizar Empresa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Nome da Empresa</Label>
                <Input
                  id="editName"
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  placeholder="Digite o nome da empresa"
                  disabled={!isSuperAdmin}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {isSuperAdmin ? 'Cancelar' : 'Fechar'}
                </Button>
                {isSuperAdmin && (
                  <Button onClick={updateOrganization} disabled={updating}>
                    {updating ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando sua primeira empresa.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{org.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}