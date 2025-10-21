import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Package, TrendingDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LotAlert {
  id: string;
  lot_number: string;
  product_id: string;
  quantity: number;
  expiration_date: string;
  status: string;
  products: {
    name: string;
    system_code: string;
  };
}

export function ExpirationAlertsPanel() {
  const { currentOrg } = useOrganization();

  const { data: lots, isLoading } = useQuery({
    queryKey: ['lot-expiration-alerts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('lot_management')
        .select(`
          id,
          lot_number,
          product_id,
          quantity,
          expiration_date,
          status,
          products (
            name,
            system_code
          )
        `)
        .eq('org_id', currentOrg.id)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', thirtyDaysFromNow.toISOString())
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      return data as LotAlert[];
    },
    enabled: !!currentOrg?.id,
  });

  const getExpirationStatus = (expirationDate: string) => {
    const days = differenceInDays(new Date(expirationDate), new Date());
    
    if (days < 0) return { label: 'Vencido', variant: 'destructive' as const, days, category: 'expired' };
    if (days <= 7) return { label: `${days}d`, variant: 'destructive' as const, days, category: 'critical' };
    if (days <= 15) return { label: `${days}d`, variant: 'warning' as const, days, category: 'warning' };
    return { label: `${days}d`, variant: 'default' as const, days, category: 'attention' };
  };

  const categorizedLots = {
    expired: lots?.filter(lot => differenceInDays(new Date(lot.expiration_date), new Date()) < 0) || [],
    critical: lots?.filter(lot => {
      const days = differenceInDays(new Date(lot.expiration_date), new Date());
      return days >= 0 && days <= 7;
    }) || [],
    warning: lots?.filter(lot => {
      const days = differenceInDays(new Date(lot.expiration_date), new Date());
      return days > 7 && days <= 15;
    }) || [],
    attention: lots?.filter(lot => {
      const days = differenceInDays(new Date(lot.expiration_date), new Date());
      return days > 15 && days <= 30;
    }) || [],
  };

  const renderLotTable = (lots: LotAlert[]) => {
    if (lots.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum lote nesta categoria
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Lote</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead>Data de Validade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => {
              const status = getExpirationStatus(lot.expiration_date);
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lot.expiration_date), 'dd/MM/yyyy')}
                      </div>
                      <Badge variant={status.variant === 'warning' ? 'secondary' : status.variant} className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={lot.status === 'active' ? 'default' : 'destructive'}
                    >
                      {lot.status === 'active' ? 'Ativo' : 'Vencido'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas de Vencimento
        </CardTitle>
        <CardDescription>
          Lotes com validade próxima ou vencida nos próximos 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando alertas...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">
                    {categorizedLots.expired.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Vencidos</div>
                </CardContent>
              </Card>
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">
                    {categorizedLots.critical.length}
                  </div>
                  <div className="text-sm text-muted-foreground">≤ 7 dias</div>
                </CardContent>
              </Card>
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-warning">
                    {categorizedLots.warning.length}
                  </div>
                  <div className="text-sm text-muted-foreground">8-15 dias</div>
                </CardContent>
              </Card>
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {categorizedLots.attention.length}
                  </div>
                  <div className="text-sm text-muted-foreground">16-30 dias</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs com detalhes */}
            <Tabs defaultValue="expired" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="expired" className="relative">
                  Vencidos
                  {categorizedLots.expired.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {categorizedLots.expired.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="critical">
                  Crítico (≤7d)
                  {categorizedLots.critical.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {categorizedLots.critical.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="warning">
                  Atenção (8-15d)
                  {categorizedLots.warning.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {categorizedLots.warning.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="attention">
                  Futuro (16-30d)
                  {categorizedLots.attention.length > 0 && (
                    <Badge className="ml-2">
                      {categorizedLots.attention.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expired" className="mt-4">
                {renderLotTable(categorizedLots.expired)}
              </TabsContent>
              <TabsContent value="critical" className="mt-4">
                {renderLotTable(categorizedLots.critical)}
              </TabsContent>
              <TabsContent value="warning" className="mt-4">
                {renderLotTable(categorizedLots.warning)}
              </TabsContent>
              <TabsContent value="attention" className="mt-4">
                {renderLotTable(categorizedLots.attention)}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
