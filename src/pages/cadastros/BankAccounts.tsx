import { useState } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowLeft } from 'lucide-react';
import { BankAccountsList } from '@/components/bank-accounts/BankAccountsList';
import { BankAccountForm } from '@/components/bank-accounts/BankAccountForm';
import { useBankAccounts, type BankAccount } from '@/hooks/useBankAccounts';

export default function BankAccounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const { accounts, loading } = useBankAccounts();

  const handleAddNew = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (showForm) {
    return (
      <PageTransition>
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCloseForm}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                </h1>
                <p className="text-muted-foreground">
                  {editingAccount ? 'Edite as informações da conta bancária' : 'Cadastre uma nova conta bancária'}
                </p>
              </div>
            </div>
          </div>

          <BankAccountForm
            account={editingAccount}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Contas Bancárias</h1>
            <p className="text-muted-foreground">
              Gerencie as contas bancárias da sua organização
            </p>
          </div>
          
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {accounts.filter(a => a.is_active).length} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(
                    accounts
                      .filter(a => a.is_active)
                      .reduce((sum, account) => sum + (account.balance || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contas ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boletos Habilitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accounts.filter(a => a.emit_boletos_erp && a.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contas configuradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Contas Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as contas bancárias da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BankAccountsList
                accounts={accounts}
                loading={loading}
                onEdit={handleEdit}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}