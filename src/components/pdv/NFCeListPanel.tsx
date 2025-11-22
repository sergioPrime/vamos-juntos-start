import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NFCeViewDialog } from '@/components/fiscal/NFCeViewDialog';
import { CancelNFCeDialog } from '@/components/fiscal/CancelNFCeDialog';
import { NFCeStatusDialog } from '@/components/fiscal/NFCeStatusDialog';
import { Search, Eye, XCircle, RefreshCw, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface NFCe {
  id: string;
  numero: number;
  serie: string;
  valor_total: number;
  status: string;
  chave_acesso: string | null;
  destinatario_cpf_cnpj: string | null;
  data_emissao: string;
}

export function NFCeListPanel() {
  const { currentOrg } = useOrganization();
  const [nfceList, setNfceList] = useState<NFCe[]>([]);
  const [filteredList, setFilteredList] = useState<NFCe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedNFCe, setSelectedNFCe] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (currentOrg?.id) {
      loadNFCeList();
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    filterList();
  }, [searchTerm, nfceList]);

  const loadNFCeList = async () => {
    if (!currentOrg?.id) return;

    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('org_id', currentOrg.id)
        .gte('data_emissao', today.toISOString())
        .order('numero', { ascending: false });

      if (error) throw error;
      setNfceList(data || []);
    } catch (error) {
      console.error('Erro ao carregar NFC-e:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterList = () => {
    if (!searchTerm.trim()) {
      setFilteredList(nfceList);
      return;
    }

    const filtered = nfceList.filter(nfce =>
      nfce.numero.toString().includes(searchTerm) ||
      nfce.chave_acesso?.includes(searchTerm) ||
      nfce.destinatario_cpf_cnpj?.includes(searchTerm)
    );
    setFilteredList(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return (
          <Badge variant="default" className="gap-1 bg-success">
            <CheckCircle className="h-3 w-3" />
            Autorizada
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        );
      case 'rejeitada':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejeitada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleView = (nfceId: string) => {
    setSelectedNFCe(nfceId);
    setViewDialogOpen(true);
  };

  const handleCancel = (nfceId: string) => {
    setSelectedNFCe(nfceId);
    setCancelDialogOpen(true);
  };

  const handleStatus = (nfceId: string) => {
    setSelectedNFCe(nfceId);
    setStatusDialogOpen(true);
  };

  const summary = {
    total: nfceList.length,
    autorizada: nfceList.filter(n => n.status === 'autorizada').length,
    cancelada: nfceList.filter(n => n.status === 'cancelada').length,
    rejeitada: nfceList.filter(n => n.status === 'rejeitada').length,
    valorTotal: nfceList.reduce((sum, n) => sum + n.valor_total, 0)
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando NFC-e...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summary.autorizada}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summary.valorTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Problemas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.cancelada + summary.rejeitada}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, chave ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={loadNFCeList} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma NFC-e encontrada hoje
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((nfce) => (
                <TableRow key={nfce.id}>
                  <TableCell className="font-medium">
                    {nfce.numero}/{nfce.serie}
                  </TableCell>
                  <TableCell>
                    {format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{nfce.destinatario_cpf_cnpj || '-'}</TableCell>
                  <TableCell>R$ {nfce.valor_total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      onClick={() => handleView(nfce.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleStatus(nfce.id)}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    {nfce.status === 'autorizada' && (
                      <Button
                        onClick={() => handleCancel(nfce.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedNFCe && (
        <>
          <NFCeViewDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            nfceId={selectedNFCe}
          />
          
          <CancelNFCeDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            nfceId={selectedNFCe}
            onSuccess={loadNFCeList}
          />
          
          <NFCeStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            nfceId={selectedNFCe}
          />
        </>
      )}
    </div>
  );
}
