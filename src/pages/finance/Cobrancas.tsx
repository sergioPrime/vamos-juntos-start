import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BoletosList } from '@/components/finance/BoletosList';
import { BoletoGenerationDialog } from '@/components/finance/BoletoGenerationDialog';
import { SettleInstallmentDialog } from '@/components/finance/SettleInstallmentDialog';
import { useBoletos } from '@/hooks/useBoletos';
import { 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  RefreshCw,
  Filter
} from 'lucide-react';

export default function Cobrancas() {
  const { boletos, loading, loadBoletos, cancelBoleto } = useBoletos();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  useEffect(() => {
    loadBoletos();
  }, [loadBoletos]);

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      loadBoletos();
    } else {
      loadBoletos({ status });
    }
  };

  const handleRegisterPayment = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setShowPaymentDialog(true);
  };

  const handleCancel = async (installmentId: string) => {
    await cancelBoleto(installmentId);
  };

  // Estatísticas
  const totalBoletos = boletos.length;
  const pendingAmount = boletos
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);
  const overdueAmount = boletos
    .filter(b => b.status === 'overdue')
    .reduce((sum, b) => sum + b.amount, 0);
  const paidAmount = boletos
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boletos e Cobranças</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie boletos bancários e cobranças
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadBoletos()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Boletos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoletos}</div>
            <p className="text-xs text-muted-foreground">Boletos gerados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {boletos.filter(b => b.status === 'pending').length} boletos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overdueAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {boletos.filter(b => b.status === 'overdue').length} boletos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {paidAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {boletos.filter(b => b.status === 'paid').length} boletos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Select value={selectedStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Boletos */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            Lista de Boletos
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BoletosList
            boletos={boletos}
            loading={loading}
            onRegisterPayment={handleRegisterPayment}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Cobranças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Taxa de Recebimento */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taxa de Recebimento</span>
                    <span className="text-sm text-muted-foreground">
                      {totalBoletos > 0 
                        ? `${((boletos.filter(b => b.status === 'paid').length / totalBoletos) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all"
                      style={{ 
                        width: totalBoletos > 0 
                          ? `${(boletos.filter(b => b.status === 'paid').length / totalBoletos) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Taxa de Inadimplência */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taxa de Inadimplência</span>
                    <span className="text-sm text-muted-foreground">
                      {totalBoletos > 0 
                        ? `${((boletos.filter(b => b.status === 'overdue').length / totalBoletos) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-destructive h-2 rounded-full transition-all"
                      style={{ 
                        width: totalBoletos > 0 
                          ? `${(boletos.filter(b => b.status === 'overdue').length / totalBoletos) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Valor Médio */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Valor Médio</div>
                    <div className="text-2xl font-bold">
                      {(totalBoletos > 0 
                        ? boletos.reduce((sum, b) => sum + b.amount, 0) / totalBoletos
                        : 0
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Maior Valor</div>
                    <div className="text-2xl font-bold">
                      {(boletos.length > 0
                        ? Math.max(...boletos.map(b => b.amount))
                        : 0
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Menor Valor</div>
                    <div className="text-2xl font-bold">
                      {(boletos.length > 0
                        ? Math.min(...boletos.map(b => b.amount))
                        : 0
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showPaymentDialog && selectedInstallmentId && (
        <SettleInstallmentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          installmentId={selectedInstallmentId}
          onSuccess={() => {
            setShowPaymentDialog(false);
            loadBoletos();
          }}
        />
      )}
    </div>
  );
}
