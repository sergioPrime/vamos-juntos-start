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
import { FileText, Plus, Search, Download, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NFe {
  id: string;
  numero: string;
  serie: string;
  cliente: string;
  data_emissao: string;
  valor_total: number;
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chave_acesso: string;
}

export default function NFe() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Dados mockados para demonstração
  const [nfeList] = useState<NFe[]>([
    {
      id: "1",
      numero: "000001",
      serie: "1",
      cliente: "Cliente Exemplo LTDA",
      data_emissao: "2025-01-15",
      valor_total: 1500.00,
      status: "autorizada",
      chave_acesso: "35250112345678000100550010000000011234567890",
    },
    {
      id: "2",
      numero: "000002",
      serie: "1",
      cliente: "Empresa ABC S.A.",
      data_emissao: "2025-01-16",
      valor_total: 2300.50,
      status: "autorizada",
      chave_acesso: "35250112345678000100550010000000021234567891",
    },
  ]);

  const getStatusBadge = (status: NFe["status"]) => {
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

  const filteredNFes = nfeList.filter((nfe) => {
    const matchesSearch =
      nfe.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.chave_acesso.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || nfe.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="title-xl flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Notas Fiscais Eletrônicas (NFe)
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas notas fiscais modelo 55
            </p>
          </div>
          <Button
            onClick={() => navigate("/fiscal/nfe/new")}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova NFe
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-level-2">
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
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="autorizada">Autorizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
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
              {filteredNFes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredNFes.map((nfe) => (
                  <TableRow key={nfe.id}>
                    <TableCell className="font-medium">{nfe.numero}</TableCell>
                    <TableCell>{nfe.serie}</TableCell>
                    <TableCell>{nfe.cliente}</TableCell>
                    <TableCell>
                      {new Date(nfe.data_emissao).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(nfe.valor_total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfe.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/fiscal/nfe/${nfe.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={nfe.status !== "autorizada"}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
