import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useBankWallets, type BankWallet } from '@/hooks/useBankAccounts';

interface WalletCardsGridProps {
  bankAccountId: string;
}

const WALLET_TYPES = [
  { value: 'com_registro', label: 'Com Registro' },
  { value: 'sem_registro', label: 'Sem Registro' },
  { value: 'cobranca_simples', label: 'Cobrança Simples' },
  { value: 'cobranca_vinculada', label: 'Cobrança Vinculada' },
  { value: 'caucionada', label: 'Caucionada' },
  { value: 'descontada', label: 'Descontada' },
];

export function WalletCardsGrid({ bankAccountId }: WalletCardsGridProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWallet, setEditingWallet] = useState<BankWallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<BankWallet | null>(null);
  const [selectedWalletType, setSelectedWalletType] = useState<string>('');
  const [formData, setFormData] = useState({
    agreement_number: '',
    fee: 0,
    add_fee_to_amount: false,
    is_default: false,
  });

  const { wallets, loading, createWallet, updateWallet, deleteWallet } = useBankWallets(bankAccountId);

  const resetForm = () => {
    setFormData({
      agreement_number: '',
      fee: 0,
      add_fee_to_amount: false,
      is_default: false,
    });
    setSelectedWalletType('');
  };

  const handleAddWallet = () => {
    setEditingWallet(null);
    resetForm();
    setShowAddDialog(true);
  };

  const handleEditWallet = (wallet: BankWallet) => {
    setEditingWallet(wallet);
    setFormData({
      agreement_number: wallet.agreement_number || '',
      fee: wallet.fee,
      add_fee_to_amount: wallet.add_fee_to_amount,
      is_default: wallet.is_default,
    });
    setSelectedWalletType(wallet.name);
    setShowAddDialog(true);
  };

  const handleSaveWallet = async () => {
    const walletType = WALLET_TYPES.find(t => t.value === selectedWalletType);
    if (!walletType) return;

    const walletData = {
      name: walletType.label,
      agreement_number: formData.agreement_number,
      fee: formData.fee,
      add_fee_to_amount: formData.add_fee_to_amount,
      with_registration: selectedWalletType === 'com_registro',
      is_default: formData.is_default,
    };

    let success = false;
    if (editingWallet) {
      success = await updateWallet(editingWallet.id, walletData);
    } else {
      success = !!await createWallet(walletData);
    }

    if (success) {
      setShowAddDialog(false);
      resetForm();
      setEditingWallet(null);
    }
  };

  const handleDeleteWallet = async () => {
    if (!walletToDelete) return;

    const success = await deleteWallet(walletToDelete.id);
    if (success) {
      setWalletToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Wallet Section */}
      <div className="flex items-center gap-4">
        <Select value={selectedWalletType} onValueChange={setSelectedWalletType}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Pesquisar Carteira" />
          </SelectTrigger>
          <SelectContent>
            {WALLET_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={handleAddWallet} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Wallets Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Padrão</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Nr. Convênio</TableHead>
              <TableHead>Taxa</TableHead>
              <TableHead className="w-20">Somar Taxa</TableHead>
              <TableHead className="w-20">Com Registro</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Nenhuma carteira configurada
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <Switch
                      checked={wallet.is_default}
                      onCheckedChange={(checked) => 
                        updateWallet(wallet.id, { is_default: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell>{wallet.agreement_number || '-'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(wallet.fee)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={wallet.add_fee_to_amount}
                      onCheckedChange={(checked) => 
                        updateWallet(wallet.id, { add_fee_to_amount: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={wallet.with_registration}
                      onCheckedChange={(checked) => 
                        updateWallet(wallet.id, { with_registration: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditWallet(wallet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setWalletToDelete(wallet)}
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

      {/* Add/Edit Wallet Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? 'Editar Carteira' : 'Adicionar Carteira'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da carteira bancária
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-type" className="text-right">
                Tipo
              </Label>
              <Select value={selectedWalletType} onValueChange={setSelectedWalletType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agreement" className="text-right">
                Nr. Convênio
              </Label>
              <Input
                id="agreement"
                value={formData.agreement_number}
                onChange={(e) => setFormData(prev => ({ ...prev, agreement_number: e.target.value }))}
                className="col-span-3"
                placeholder="Número do convênio"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Taxa (R$)
              </Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={formData.fee}
                onChange={(e) => setFormData(prev => ({ ...prev, fee: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-fee" className="text-right">
                Somar Taxa
              </Label>
              <Switch
                id="add-fee"
                checked={formData.add_fee_to_amount}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, add_fee_to_amount: checked }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default" className="text-right">
                Padrão
              </Label>
              <Switch
                id="default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWallet} disabled={!selectedWalletType}>
              {editingWallet ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!walletToDelete} onOpenChange={() => setWalletToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Carteira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a carteira "{walletToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWallet} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}