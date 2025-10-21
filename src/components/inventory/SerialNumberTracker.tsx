import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Hash, Search, Package, MapPin, History } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface SerialNumber {
  id: string;
  serial_number: string;
  product_id: string;
  lot_id: string | null;
  status: string;
  current_location: string | null;
  products: {
    name: string;
    system_code: string;
  };
  lot_management: {
    lot_number: string;
  } | null;
}

interface SerialHistory {
  id: string;
  movement_type: string;
  location: string;
  created_at: string;
  notes: string | null;
}

export function SerialNumberTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const { data: serials, isLoading } = useQuery({
    queryKey: ['serial-numbers', currentOrg?.id, searchTerm],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      let query = supabase
        .from('serial_number_tracking')
        .select(`
          id,
          serial_number,
          product_id,
          lot_id,
          status,
          current_location,
          products (
            name,
            system_code
          ),
          lot_management (
            lot_number
          )
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('serial_number', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SerialNumber[];
    },
    enabled: !!currentOrg?.id,
  });

  const { data: history } = useQuery({
    queryKey: ['serial-history', selectedSerial?.id],
    queryFn: async () => {
      if (!selectedSerial?.id) return [];

      const { data, error } = await supabase
        .from('serial_number_history')
        .select('*')
        .eq('serial_number_id', selectedSerial.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SerialHistory[];
    },
    enabled: !!selectedSerial?.id && showHistoryDialog,
  });

  const handleViewHistory = (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setShowHistoryDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Disponível</Badge>;
      case 'sold':
        return <Badge variant="secondary">Vendido</Badge>;
      case 'reserved':
        return <Badge>Reservado</Badge>;
      case 'defective':
        return <Badge variant="destructive">Defeituoso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'in': 'Entrada',
      'out': 'Saída',
      'transfer': 'Transferência',
      'sale': 'Venda',
      'return': 'Devolução',
      'adjustment': 'Ajuste',
    };
    return labels[type] || type;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Rastreamento de Números de Série
              </CardTitle>
              <CardDescription>
                Acompanhe a localização e histórico de produtos com número de série
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando números de série...
            </div>
          ) : !serials || serials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum número de série encontrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serials.map((serial) => (
                    <TableRow key={serial.id}>
                      <TableCell className="font-mono font-medium">
                        {serial.serial_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{serial.products.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Cód: {serial.products.system_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {serial.lot_management ? (
                          <Badge variant="outline">
                            <Package className="mr-1 h-3 w-3" />
                            {serial.lot_management.lot_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {serial.current_location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {serial.current_location}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(serial.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHistory(serial)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Histórico
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Histórico do Número de Série</DialogTitle>
            <DialogDescription>
              {selectedSerial && (
                <div className="mt-2 space-y-1">
                  <div>Série: <span className="font-mono font-semibold">{selectedSerial.serial_number}</span></div>
                  <div>Produto: <span className="font-semibold">{selectedSerial.products.name}</span></div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            {!history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum histórico encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge>{getMovementTypeLabel(item.movement_type)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-sm text-muted-foreground">
                        {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
