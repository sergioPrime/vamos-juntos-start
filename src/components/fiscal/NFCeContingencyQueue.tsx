import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useNFCeContingency } from '@/hooks/useNFCeContingency';
import { Upload, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ContingencyItem {
  id: string;
  nfce_data: any;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'transmitting' | 'transmitted' | 'failed';
  error_message?: string;
}

interface NFCeContingencyQueueProps {
  queue: ContingencyItem[];
  onRefresh: () => void;
}

export function NFCeContingencyQueue({ queue, onRefresh }: NFCeContingencyQueueProps) {
  const { transmitFromQueue, removeFromQueue } = useNFCeContingency();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transmittingId, setTransmittingId] = useState<string | null>(null);

  const handleTransmit = async (itemId: string) => {
    setTransmittingId(itemId);
    try {
      await transmitFromQueue(itemId);
      onRefresh();
    } catch (error) {
      console.error('Erro ao transmitir:', error);
    } finally {
      setTransmittingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await removeFromQueue(selectedItem);
      onRefresh();
    } catch (error) {
      console.error('Erro ao remover:', error);
    } finally {
      setIsDeleting(false);
      setSelectedItem(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'transmitting':
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Transmitindo
          </Badge>
        );
      case 'transmitted':
        return (
          <Badge variant="default" className="gap-1 bg-success">
            <CheckCircle className="h-3 w-3" />
            Transmitida
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Erro
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma NFC-e na fila de transmissão</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.nfce_data?.numero || '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  R$ {item.nfce_data?.valor_total?.toFixed(2) || '0,00'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.retry_count}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right space-x-2">
                  {(item.status === 'pending' || item.status === 'failed') && (
                    <Button
                      onClick={() => handleTransmit(item.id)}
                      disabled={transmittingId === item.id}
                      size="sm"
                      variant="outline"
                    >
                      {transmittingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {item.status !== 'transmitted' && (
                    <Button
                      onClick={() => setSelectedItem(item.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da fila?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A NFC-e será removida da fila de
              transmissão e não será enviada para SEFAZ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
