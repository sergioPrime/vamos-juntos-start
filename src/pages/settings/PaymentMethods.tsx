import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods'
import { ResponsiveTable } from '@/components/ui/responsive-table'

const paymentTypeOptions = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'check', label: 'Cheque' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'pix', label: 'PIX' },
  { value: 'digital_wallet', label: 'Carteira Digital' },
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
    toggleActive
  } = usePaymentMethods()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    active: true
  })

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let success = false
    if (editingMethod) {
      success = await updatePaymentMethod(editingMethod.id, formData)
    } else {
      success = await createPaymentMethod(formData)
    }

    if (success) {
      setIsDialogOpen(false)
      setEditingMethod(null)
      setFormData({ name: '', type: '', active: true })
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type,
      active: method.active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deletePaymentMethod(id)
  }

  const handleBulkDelete = async () => {
    const promises = selectedItems.map(id => deletePaymentMethod(id))
    await Promise.all(promises)
    setSelectedItems([])
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = filteredMethods
        .filter(method => !method.is_default)
        .map(method => method.id)
      setSelectedItems(selectableIds)
    } else {
      setSelectedItems([])
    }
  }

  const getTypeLabel = (type: string) => {
    return paymentTypeOptions.find(option => option.value === type)?.label || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie as formas de pagamento disponíveis no sistema
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMethod(null)
              setFormData({ name: '', type: '', active: true })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Editar' : 'Nova'} Forma de Pagamento
                </DialogTitle>
                <DialogDescription>
                  {editingMethod ? 'Edite os dados da forma de pagamento.' : 'Adicione uma nova forma de pagamento ao sistema.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da forma de pagamento"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, active: checked as boolean }))
                    }
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.name || !formData.type}>
                  {editingMethod ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Lista de Formas de Pagamento</CardTitle>
          
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Selecionados ({selectedItems.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {selectedItems.length} forma(s) de pagamento selecionada(s)?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                      checked={selectedItems.length === filteredMethods.filter(m => !m.is_default).length && filteredMethods.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando formas de pagamento...
                    </TableCell>
                  </TableRow>
                ) : filteredMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm ? 'Nenhuma forma de pagamento encontrada.' : 'Nenhuma forma de pagamento cadastrada.'}
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
                      <TableCell>{getTypeLabel(method.type)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(method.id, !method.active)}
                          className="p-1"
                        >
                          {method.active ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <X className="h-3 w-3" />
                              Inativo
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {method.is_default && (
                          <Badge variant="outline">Sistema</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(method)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {!method.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a forma de pagamento "{method.name}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(method.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  )
}