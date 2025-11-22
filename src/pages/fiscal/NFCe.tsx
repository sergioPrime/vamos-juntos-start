import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import { useNFCe } from '@/hooks/useNFCe';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Printer } from 'lucide-react';
import { NFCeConfigStatus } from '@/components/fiscal/NFCeConfigStatus';
import { NFCePrintDialog } from '@/components/fiscal/NFCePrintDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function NFCe() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { nfceList, isLoading } = useNFCe(currentOrg?.id || '');
  const [selectedNFCe, setSelectedNFCe] = useState<any>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const handlePrint = (nfce: any) => {
    setSelectedNFCe(nfce);
    setPrintDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      autorizada: 'default',
      cancelada: 'destructive',
      denegada: 'destructive',
      rejeitada: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NFC-e</h1>
          <p className="text-muted-foreground">Nota Fiscal de Consumidor Eletrônica</p>
        </div>
        <Button onClick={() => navigate('/fiscal/nfce/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Emitir NFC-e
        </Button>
      </div>

      <div className="space-y-4">
        <NFCeConfigStatus orgId={currentOrg?.id || ''} />
        
        {/* NFCe Listing */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando NFC-e...
            </div>
          ) : nfceList && nfceList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nfceList.map((nfce) => (
                  <TableRow key={nfce.id}>
                    <TableCell>{nfce.numero}</TableCell>
                    <TableCell>{nfce.serie}</TableCell>
                    <TableCell>
                      {new Date(nfce.data_emissao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{nfce.consumidor_nome || 'Consumidor Final'}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(nfce.valor_total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(nfce)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma NFC-e emitida ainda
            </div>
          )}
        </div>
      </div>

      {/* Print Dialog */}
      <NFCePrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        nfce={selectedNFCe}
      />
    </div>
  );
}
