import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Link2, Unlink } from 'lucide-react'
import { useBankReconciliation } from '@/hooks/useBankReconciliation'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Skeleton } from '@/components/ui/skeleton'

export function BankReconciliation() {
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const { accounts, loading: accountsLoading } = useBankAccounts()
  const {
    loading,
    bankTransactions,
    unmatchedEntries,
    matchTransaction,
    unmatchTransaction
  } = useBankReconciliation(selectedBankAccount)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (accountsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conciliação Bancária</h2>
          <p className="text-muted-foreground">Concilie transações bancárias com lançamentos financeiros</p>
        </div>
        
        <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione uma conta bancária" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.bank_name} - {account.account_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedBankAccount ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Selecione uma conta bancária para iniciar a conciliação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Transações Bancárias */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Bancárias</CardTitle>
              <CardDescription>
                {bankTransactions.filter(t => !t.matched).length} transação(ões) não conciliada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : bankTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      bankTransactions.map(transaction => (
                        <TableRow
                          key={transaction.id}
                          className={selectedTransaction === transaction.id ? 'bg-muted' : ''}
                        >
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.matched ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.matched ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => unmatchTransaction(transaction.id)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTransaction(transaction.id)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Lançamentos Financeiros */}
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>
                {unmatchedEntries.length} lançamento(s) não conciliado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTransaction ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Selecione uma transação bancária para conciliar
                </div>
              ) : (
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unmatchedEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum lançamento disponível para conciliação
                          </TableCell>
                        </TableRow>
                      ) : (
                        unmatchedEntries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.competence_date)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {entry.description}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              entry.entry_type === 'receivable' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={entry.entry_type === 'receivable' ? 'default' : 'destructive'}>
                                {entry.entry_type === 'receivable' ? 'Receber' : 'Pagar'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  matchTransaction(selectedTransaction, entry.id)
                                  setSelectedTransaction(null)
                                }}
                              >
                                Conciliar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
