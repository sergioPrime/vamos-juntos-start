import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Package, Calendar, AlertTriangle } from 'lucide-react';
import { LotFormDialog } from './LotFormDialog';
import { format, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Lot {
  id: string;
  lot_number: string;
  product_id: string;
  quantity: number;
  manufacturing_date: string | null;
  expiration_date: string | null;
  status: string;
  products: {
    name: string;
    system_code: string;
  };
}

export function LotManagementPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLotDialog, setShowLotDialog] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const { data: lots, isLoading, refetch } = useQuery({
    queryKey: ['lots', currentOrg?.id, searchTerm],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      let query = supabase
        .from('lot_management')
        .select(`
          id,
          lot_number,
          product_id,
          quantity,
          manufacturing_date,
          expiration_date,
          status,
          products (
            name,
            system_code
          )
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`lot_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lot[];
    },
    enabled: !!currentOrg?.id,
  });

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { label: 'Sem Validade', variant: 'secondary' as const, days: null };
    
    const days = differenceInDays(new Date(expirationDate), new Date());
    
    if (days < 0) return { label: 'Vencido', variant: 'destructive' as const, days };
    if (days <= 7) return { label: `${days}d restantes`, variant: 'destructive' as const, days };
    if (days <= 30) return { label: `${days}d restantes`, variant: 'warning' as const, days };
    return { label: `${days}d restantes`, variant: 'default' as const, days };
  };

  const handleEdit = (lot: Lot) => {
    setSelectedLot(lot);
    setShowLotDialog(true);
  };

  const handleCloseDialog = () => {
    setShowLotDialog(false);
    setSelectedLot(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseDialog();
    toast({
      title: 'Sucesso',
      description: selectedLot ? 'Lote atualizado com sucesso' : 'Lote criado com sucesso',
    });
  };

  const filteredLots = lots || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciamento de Lotes
            </CardTitle>
            <CardDescription>
              Controle e rastreamento de lotes de produtos
            </CardDescription>
          </div>
          <Button onClick={() => setShowLotDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lote
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando lotes...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lote encontrado
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Lote</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Fabricação</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
                  const expirationStatus = getExpirationStatus(lot.expiration_date);
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.products.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Cód: {lot.products.system_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{lot.quantity}</TableCell>
                      <TableCell>
                        {lot.manufacturing_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(lot.manufacturing_date), 'dd/MM/yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lot.expiration_date ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(lot.expiration_date), 'dd/MM/yyyy')}
                            </div>
                            <Badge variant={expirationStatus.variant === 'warning' ? 'secondary' : expirationStatus.variant} className="text-xs">
                              {expirationStatus.days !== null && expirationStatus.days <= 30 && (
                                <AlertTriangle className="mr-1 h-3 w-3" />
                              )}
                              {expirationStatus.label}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lot.status === 'active' ? 'default' :
                            lot.status === 'expired' ? 'destructive' : 'secondary'
                          }
                        >
                          {lot.status === 'active' ? 'Ativo' :
                           lot.status === 'expired' ? 'Vencido' : 'Usado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lot)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <LotFormDialog
        open={showLotDialog}
        onOpenChange={handleCloseDialog}
        lot={selectedLot}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
