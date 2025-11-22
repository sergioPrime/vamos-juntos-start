import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopCustomer } from '@/hooks/useFinancialReports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users } from 'lucide-react';

interface TopCustomersTableProps {
  customers: TopCustomer[];
  loading?: boolean;
}

export function TopCustomersTable({ customers, loading }: TopCustomersTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top 10 Clientes por Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado no período</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-center">Transações</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {index < 3 ? (
                          <Badge 
                            variant="default" 
                            className={
                              index === 0 ? 'bg-yellow-500 text-yellow-950' :
                              index === 1 ? 'bg-gray-400 text-gray-950' :
                              'bg-amber-600 text-amber-950'
                            }
                          >
                            {index + 1}º
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{index + 1}º</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{customer.transaction_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(customer.avg_ticket)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Insights */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Insights</p>
                  <p className="text-sm text-muted-foreground">
                    {customers.length > 0 && (
                      <>
                        O cliente <span className="font-semibold">{customers[0].name}</span> representa{' '}
                        {((customers[0].total_amount / customers.reduce((sum, c) => sum + c.total_amount, 0)) * 100).toFixed(1)}%{' '}
                        do faturamento total dos top clientes.
                      </>
                    )}
                  </p>
                  {customers.length >= 3 && (
                    <p className="text-sm text-muted-foreground">
                      Os 3 principais clientes respondem por{' '}
                      <span className="font-semibold">
                        {formatCurrency(customers.slice(0, 3).reduce((sum, c) => sum + c.total_amount, 0))}
                      </span>{' '}
                      do faturamento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
