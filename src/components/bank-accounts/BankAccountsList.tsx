import { useState } from 'react';
import { MoreHorizontal, Edit, Eye, EyeOff, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBankAccounts, type BankAccount } from '@/hooks/useBankAccounts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BankAccountsListProps {
  accounts: BankAccount[];
  loading: boolean;
  onEdit: (account: BankAccount) => void;
}

export function BankAccountsList({ accounts, loading, onEdit }: BankAccountsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [accountToToggle, setAccountToToggle] = useState<BankAccount | null>(null);
  
  const { toggleAccountStatus } = useBankAccounts();

  const handleToggleStatus = async (account: BankAccount) => {
    setAccountToToggle(account);
  };

  const confirmToggleStatus = async () => {
    if (accountToToggle) {
      await toggleAccountStatus(accountToToggle.id, !accountToToggle.is_active);
      setAccountToToggle(null);
    }
  };

  // Filter accounts based on search and filters
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.agency && account.agency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.companies?.name && account.companies.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && account.is_active) ||
      (statusFilter === 'inactive' && !account.is_active);

    const matchesBank = bankFilter === 'all' || account.bank_name === bankFilter;

    return matchesSearch && matchesStatus && matchesBank;
  });

  // Get unique bank names for filter
  const uniqueBanks = Array.from(new Set(accounts.map(account => account.bank_name)));

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Buscar por banco, conta, agência ou empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-sm"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os bancos</SelectItem>
            {uniqueBanks.map(bank => (
              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banco</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Boletos</TableHead>
              <TableHead>PIX</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {accounts.length === 0 
                    ? "Nenhuma conta bancária cadastrada"
                    : "Nenhuma conta encontrada com os filtros aplicados"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="font-medium">{account.bank_name}</div>
                    {account.bank_code && (
                      <div className="text-sm text-muted-foreground">
                        Código: {account.bank_code}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{account.account_number}</div>
                    {account.agency && (
                      <div className="text-sm text-muted-foreground">
                        Ag: {account.agency}
                        {account.agency_digit && `-${account.agency_digit}`}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {account.companies?.name || '-'}
                  </TableCell>
                  
                  <TableCell>
                    <div className={`font-medium ${
                      account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(account.balance)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={account.emit_boletos_erp ? "default" : "secondary"}>
                      {account.emit_boletos_erp ? 'Habilitado' : 'Desabilitado'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={account.enable_pix_sales ? "default" : "secondary"}>
                      {account.enable_pix_sales ? 'Habilitado' : 'Desabilitado'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                          {account.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!accountToToggle} onOpenChange={() => setAccountToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountToToggle?.is_active ? 'Desativar' : 'Ativar'} Conta Bancária
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {accountToToggle?.is_active ? 'desativar' : 'ativar'} 
              a conta {accountToToggle?.bank_name} - {accountToToggle?.account_number}?
              {accountToToggle?.is_active && (
                <span className="block mt-2 text-amber-600">
                  Contas desativadas não aparecerão para seleção em novos lançamentos.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {accountToToggle?.is_active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}