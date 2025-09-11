import { useState } from "react"
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePaymentMethods, PaymentMethod } from "@/hooks/usePaymentMethods"
import { ResponsiveTable } from "@/components/ui/responsive-table"

const paymentTypes = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'check', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'pix', label: 'PIX' },
  { value: 'voucher', label: 'Vale' },
  { value: 'other', label: 'Outros' },
]

export default function PaymentMethods() {
  const {
    paymentMethods,
    loading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
    deleteMultiple
  } = usePaymentMethods()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "other"
  })

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredMethods.filter(m => !m.is_default).map(m => m.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleCreate = async () => {
    if (await createPaymentMethod(formData)) {
      setShowCreateDialog(false)
      setFormData({ name: "", type: "other" })
    }
  }

  const handleEdit = async () => {
    if (!editingMethod) return
    
    if (await updatePaymentMethod(editingMethod.id, {
      name: formData.name,
      type: formData.type
    })) {
      setShowEditDialog(false)
      setEditingMethod(null)
      setFormData({ name: "", type: "other" })
    }
  }

  const handleDelete = async () => {
    if (!deletingMethod) return
    
    if (await deletePaymentMethod(deletingMethod.id)) {
      setShowDeleteDialog(false)
      setDeletingMethod(null)
    }
  }

  const handleBulkDelete = async () => {
    if (await deleteMultiple(selectedItems)) {
      setShowBulkDeleteDialog(false)
      setSelectedItems([])
    }
  }

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (method: PaymentMethod) => {
    setDeletingMethod(method)
    setShowDeleteDialog(true)
  }

  return (
    <div className="page-container space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie as formas de pagamento disponíveis no sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Selecionados ({selectedItems.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === filteredMethods.filter(m => !m.is_default).length && filteredMethods.filter(m => !m.is_default).length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={filteredMethods.filter(m => !m.is_default).length === 0}
                    />
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhuma forma de pagamento encontrada." : "Nenhuma forma de pagamento cadastrada."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(method.id)}
                          onCheckedChange={(checked) => handleSelectItem(method.id, checked as boolean)}
                          disabled={method.is_default}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{method.code}</TableCell>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        {paymentTypes.find(t => t.value === method.type)?.label || method.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.active ? "default" : "secondary"}>
                          {method.active ? "Ativo" : "Inativo"}
                        </Badge>
                        {method.is_default && (
                          <Badge variant="outline" className="ml-2">
                            Padrão
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(method.id, !method.active)}
                            title={method.active ? "Desativar" : "Ativar"}
                          >
                            {method.active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(method)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!method.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(method)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Adicione uma nova forma de pagamento personalizada ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cartão Empresa"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Altere os dados da forma de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cartão Empresa"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a forma de pagamento "{deletingMethod?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedItems.length} forma(s) de pagamento selecionada(s)?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}