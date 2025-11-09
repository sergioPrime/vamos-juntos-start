import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Search, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFiscalOperations, FiscalOperation } from '@/hooks/useFiscalOperations';
import { useTaxGroups } from '@/hooks/useTaxGroups';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function FiscalOperations() {
  const navigate = useNavigate();
  const { fiscalOperations, loading, deleteFiscalOperation, duplicateFiscalOperation } = useFiscalOperations();
  const { taxGroups } = useTaxGroups();
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterTaxGroup, setFilterTaxGroup] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<FiscalOperation | null>(null);

  const filteredOperations = fiscalOperations.filter((op) => {
    const matchesSearch = op.operation_name.toLowerCase().includes(search.toLowerCase());
    const matchesState = filterState === 'all' || op.destination_state === filterState;
    const matchesTaxGroup = filterTaxGroup === 'all' || op.tax_group_id === filterTaxGroup;
    return matchesSearch && matchesState && matchesTaxGroup;
  });

  const handleDelete = async () => {
    if (!selectedOperation) return;
    try {
      await deleteFiscalOperation(selectedOperation.id);
      setShowDeleteDialog(false);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Erro ao excluir operação fiscal:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedOperation) return;
    try {
      await duplicateFiscalOperation(selectedOperation.id);
      setShowDuplicateDialog(false);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Erro ao duplicar operação fiscal:', error);
    }
  };

  const getTaxGroupName = (taxGroupId: string) => {
    const group = taxGroups.find((g) => g.id === taxGroupId);
    return group?.name || '-';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operações Fiscais</CardTitle>
            <Button onClick={() => navigate('/cadastros/fiscal-operations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Operação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar operação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTaxGroup} onValueChange={setFilterTaxGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Grupo Tributário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {taxGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger>
                <SelectValue placeholder="UF Destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Grupo Tributário</TableHead>
                  <TableHead>UF Destino</TableHead>
                  <TableHead>Situação ICMS</TableHead>
                  <TableHead>Situação PIS</TableHead>
                  <TableHead>Situação COFINS</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredOperations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhuma operação fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-medium">{operation.operation_name}</TableCell>
                      <TableCell>{getTaxGroupName(operation.tax_group_id)}</TableCell>
                      <TableCell>{operation.destination_state}</TableCell>
                      <TableCell>{operation.icms_situation || '-'}</TableCell>
                      <TableCell>{operation.pis_situation}</TableCell>
                      <TableCell>{operation.cofins_situation}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/cadastros/fiscal-operations/${operation.id}`)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOperation(operation);
                              setShowDuplicateDialog(true);
                            }}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOperation(operation);
                              setShowDeleteDialog(true);
                            }}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a operação fiscal "{selectedOperation?.operation_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar Operação Fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar uma cópia da operação fiscal "{selectedOperation?.operation_name}"?
              Uma nova operação será criada com os mesmos dados e o nome "{selectedOperation?.operation_name} - Cópia".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicate}>Duplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
