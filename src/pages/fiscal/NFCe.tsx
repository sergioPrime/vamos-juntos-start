import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Search, Download, Eye, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NFCe {
  id: string;
  numero: string;
  serie: string;
  cliente: string;
  data_emissao: string;
  valor_total: number;
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chave_acesso: string;
}

export default function NFCe() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<string>("todos");

  // Dados mockados para demonstração
  const [nfceList] = useState<NFCe[]>([
    {
      id: "1",
      numero: "000001",
      serie: "1",
      cliente: "Consumidor Final",
      data_emissao: "2025-01-15",
      valor_total: 150.00,
      status: "autorizada",
      chave_acesso: "35250112345678000100650010000000011234567890",
    },
    {
      id: "2",
      numero: "000002",
      serie: "1",
      cliente: "João Silva",
      data_emissao: "2025-01-16",
      valor_total: 230.50,
      status: "autorizada",
      chave_acesso: "35250112345678000100650010000000021234567891",
    },
  ]);

  const getStatusBadge = (status: NFCe["status"]) => {
    const variants = {
      autorizada: "default",
      cancelada: "destructive",
      pendente: "secondary",
      rejeitada: "destructive",
    };

    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredNFCes = nfceList.filter((nfce) => {
    const matchesSearch =
      nfce.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfce.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfce.chave_acesso.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || nfce.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="title-xl flex items-center gap-2">
              <Receipt className="h-8 w-8 text-primary" />
              Nota Fiscal do Consumidor Eletrônica (NFC-e)
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas notas fiscais modelo 65
            </p>
          </div>
          <Button
            onClick={() => navigate("/fiscal/nfce/new")}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova NFC-e
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-level-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, cliente ou chave de acesso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Total de Notas</p>
                <p className="text-2xl font-bold">{nfceList.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {nfceList.filter((n) => n.status === "autorizada").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {nfceList.filter((n) => n.status === "pendente").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold font-mono">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(
                    nfceList
                      .filter((n) => n.status === "autorizada")
                      .reduce((acc, n) => acc + n.valor_total, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card className="bg-level-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNFCes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredNFCes.map((nfce) => (
                  <TableRow key={nfce.id}>
                    <TableCell className="font-medium">{nfce.numero}</TableCell>
                    <TableCell>{nfce.serie}</TableCell>
                    <TableCell>{nfce.cliente}</TableCell>
                    <TableCell>
                      {new Date(nfce.data_emissao).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(nfce.valor_total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/fiscal/nfce/${nfce.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
