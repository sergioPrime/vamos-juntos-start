import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNFCe } from '@/hooks/useNFCe';
import { NFCeConfigStatus } from '@/components/fiscal/NFCeConfigStatus';
import { Plus, Search, FileText, DollarSign, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export default function NFCe() {
  const navigate = useNavigate();
  const { nfceList, loading } = useNFCe();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pendente: 'secondary',
      autorizada: 'default',
      cancelada: 'destructive',
      rejeitada: 'destructive',
    };

    const labels: Record<string, string> = {
      pendente: 'Pendente',
      autorizada: 'Autorizada',
      cancelada: 'Cancelada',
      rejeitada: 'Rejeitada',
    };

    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const filteredNFCe = nfceList.filter((nfce) => {
    const matchesSearch =
      nfce.numero.toString().includes(searchTerm) ||
      nfce.destinatario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfce.destinatario_documento?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || nfce.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAutorizadas = nfceList.filter((n) => n.status === 'autorizada').length;
  const totalCanceladas = nfceList.filter((n) => n.status === 'cancelada').length;
  const valorTotal = nfceList
    .filter((n) => n.status === 'autorizada')
    .reduce((acc, n) => acc + n.valor_total, 0);

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NFC-e</h1>
          <p className="text-muted-foreground">Nota Fiscal de Consumidor Eletrônica</p>
        </div>
        <Button onClick={() => navigate('/fiscal/nfce/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova NFC-e
        </Button>
      </div>

      {/* Status da Configuração */}
      <NFCeConfigStatus />

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por número, cliente ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="autorizada">Autorizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de NFC-e</p>
                <p className="text-2xl font-bold">{nfceList.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">{totalAutorizadas}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredNFCe.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma NFC-e encontrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNFCe.map((nfce) => (
                  <TableRow key={nfce.id}>
                    <TableCell className="font-medium">{nfce.numero}</TableCell>
                    <TableCell>{nfce.serie}</TableCell>
                    <TableCell>
                      {nfce.destinatario_nome || 'Consumidor'}
                      {nfce.destinatario_documento && (
                        <div className="text-xs text-muted-foreground">{nfce.destinatario_documento}</div>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      R$ {nfce.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="capitalize">
                      {nfce.forma_pagamento?.replace('_', ' ') || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
