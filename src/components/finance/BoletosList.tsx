import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Boleto } from '@/hooks/useBoletos';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  DollarSign, 
  X, 
  Copy,
  Printer 
} from 'lucide-react';
import { toast } from 'sonner';

interface BoletosListProps {
  boletos: Boleto[];
  loading: boolean;
  onRegisterPayment: (installmentId: string) => void;
  onCancel: (installmentId: string) => void;
}

export function BoletosList({
  boletos,
  loading,
  onRegisterPayment,
  onCancel
}: BoletosListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBoletos = boletos.filter((boleto) =>
    boleto.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boleto.boleto_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boleto.person_document.includes(searchTerm)
  );

  const getStatusBadge = (status: Boleto['status']) => {
    const variants = {
      pending: { variant: 'default' as const, label: 'Pendente' },
      paid: { variant: 'default' as const, label: 'Pago', className: 'bg-success text-success-foreground' },
      overdue: { variant: 'destructive' as const, label: 'Vencido' },
      cancelled: { variant: 'secondary' as const, label: 'Cancelado' }
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const handlePrint = (boleto: Boleto) => {
    // Simulação de impressão
    toast.success('Boleto enviado para impressão');
  };

  const handleDownloadPDF = (boleto: Boleto) => {
    // Simulação de download
    toast.success('PDF do boleto baixado');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando boletos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Boletos Gerados ({filteredBoletos.length})
          </CardTitle>
          <Input
            placeholder="Buscar por cliente, número ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredBoletos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum boleto encontrado' : 'Nenhum boleto gerado ainda'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linha Digitável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoletos.map((boleto) => (
                  <TableRow key={boleto.id}>
                    <TableCell className="font-mono text-sm">
                      {boleto.boleto_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{boleto.person_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {boleto.person_document}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(boleto.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {boleto.amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {boleto.digitable_line}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(boleto.digitable_line, 'Linha digitável')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPDF(boleto)}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(boleto)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(boleto.barcode, 'Código de barras')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Código de Barras
                          </DropdownMenuItem>
                          {boleto.status === 'pending' || boleto.status === 'overdue' ? (
                            <>
                              <DropdownMenuItem 
                                onClick={() => onRegisterPayment(boleto.installment_id!)}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Registrar Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onCancel(boleto.installment_id!)}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Boleto
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
