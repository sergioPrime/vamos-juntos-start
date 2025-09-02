import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  document?: string
  email?: string
  phone?: string
  contact_person?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  supplier_type: string
  payment_terms?: string
  credit_limit: number
  is_active: boolean
  notes?: string
  created_at: string
}

interface NewSupplierForm {
  name: string
  document: string
  email: string
  phone: string
  contact_person: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  supplier_type: string
  payment_terms: string
  credit_limit: number
  notes: string
}

const Suppliers = () => {
  const { user } = useAuth()
  const { currentOrg: currentOrganization } = useOrganization()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>({
    name: '',
    document: '',
    email: '',
    phone: '',
    contact_person: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'BR',
    supplier_type: 'vendor',
    payment_terms: '',
    credit_limit: 0,
    notes: ''
  })

  useEffect(() => {
    if (currentOrganization) {
      fetchSuppliers()
    }
  }, [currentOrganization])

  const fetchSuppliers = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching suppliers:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar fornecedores",
          variant: "destructive",
        })
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar fornecedores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async () => {
    if (!currentOrganization || !user) return

    try {
      const supplierData = {
        ...newSupplier,
        org_id: currentOrganization.id,
        created_by: user.id
      }

      const { error } = await supabase
        .from('suppliers')
        .insert(supplierData)

      if (error) {
        console.error('Error creating supplier:', error)
        toast({
          title: "Erro",
          description: "Erro ao criar fornecedor",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchSuppliers()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar fornecedor",
        variant: "destructive",
      })
    }
  }

  const updateSupplier = async () => {
    if (!editingSupplier) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .update(newSupplier)
        .eq('id', editingSupplier.id)

      if (error) {
        console.error('Error updating supplier:', error)
        toast({
          title: "Erro",
          description: "Erro ao atualizar fornecedor",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      })

      setEditingSupplier(null)
      resetForm()
      fetchSuppliers()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar fornecedor",
        variant: "destructive",
      })
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting supplier:', error)
        toast({
          title: "Erro",
          description: "Erro ao excluir fornecedor",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso",
      })

      fetchSuppliers()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir fornecedor",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNewSupplier({
      name: '',
      document: '',
      email: '',
      phone: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'BR',
      supplier_type: 'vendor',
      payment_terms: '',
      credit_limit: 0,
      notes: ''
    })
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setNewSupplier({
      name: supplier.name,
      document: supplier.document || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contact_person: supplier.contact_person || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zip_code: supplier.zip_code || '',
      country: supplier.country,
      supplier_type: supplier.supplier_type,
      payment_terms: supplier.payment_terms || '',
      credit_limit: supplier.credit_limit,
      notes: supplier.notes || ''
    })
    setIsCreateDialogOpen(true)
  }

  const closeDialog = () => {
    setIsCreateDialogOpen(false)
    setEditingSupplier(null)
    resetForm()
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seu cadastro de fornecedores</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier ? 'Atualize os dados do fornecedor' : 'Cadastre um novo fornecedor'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="document">CNPJ/CPF</Label>
                  <Input
                    id="document"
                    value={newSupplier.document}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, document: e.target.value }))}
                    placeholder="CNPJ ou CPF"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@fornecedor.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Pessoa de Contato</Label>
                  <Input
                    id="contact_person"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier_type">Tipo</Label>
                  <Select value={newSupplier.supplier_type} onValueChange={(value) => setNewSupplier(prev => ({ ...prev, supplier_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Fornecedor</SelectItem>
                      <SelectItem value="service_provider">Prestador de Serviço</SelectItem>
                      <SelectItem value="distributor">Distribuidor</SelectItem>
                      <SelectItem value="manufacturer">Fabricante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newSupplier.state}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="UF"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={newSupplier.zip_code}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="CEP"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                  <Input
                    id="payment_terms"
                    value={newSupplier.payment_terms}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, payment_terms: e.target.value }))}
                    placeholder="Ex: 30/60/90 dias"
                  />
                </div>
                
                <div>
                  <Label htmlFor="credit_limit">Limite de Crédito</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSupplier.credit_limit}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, credit_limit: Number(e.target.value) }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais sobre o fornecedor"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={editingSupplier ? updateSupplier : createSupplier}>
                {editingSupplier ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Fornecedores</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.contact_person && (
                        <div className="text-sm text-muted-foreground">{supplier.contact_person}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.document || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.city && supplier.state && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {supplier.city}, {supplier.state}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {supplier.supplier_type === 'vendor' && 'Fornecedor'}
                      {supplier.supplier_type === 'service_provider' && 'Prestador'}
                      {supplier.supplier_type === 'distributor' && 'Distribuidor'}
                      {supplier.supplier_type === 'manufacturer' && 'Fabricante'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                      {supplier.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSupplier(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Suppliers