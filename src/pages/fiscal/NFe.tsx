import { useState, useMemo } from "react";
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
import { FileText, Plus, Search, Loader2 } from "lucide-react";
import NFeActionsMenu from "@/components/fiscal/NFeActionsMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNFe } from "@/hooks/useNFe";
import { Skeleton } from "@/components/ui/skeleton";

export default function NFe() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { nfeList, isLoading } = useNFe();

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, any> = {
      autorizada: "default",
      cancelada: "destructive",
      pendente: "secondary",
      rejeitada: "destructive",
      rascunho: "outline",
    };

    const statusText = status || "rascunho";
    return (
      <Badge variant={variants[statusText] || "outline"}>
        {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
      </Badge>
    );
  };

  const filteredNFes = useMemo(() => {
    return nfeList.filter((nfe) => {
      const clienteName = nfe.pessoas?.nome || "";
      const numero = nfe.numero?.toString() || "";
      const chave = nfe.chave_acesso || "";

      const matchesSearch =
        numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clienteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chave.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" || nfe.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [nfeList, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: nfeList.length,
      autorizadas: nfeList.filter((n) => n.status === "autorizada").length,
      pendentes: nfeList.filter((n) => n.status === "pendente" || n.status === "rascunho").length,
      valorTotal: nfeList
        .filter((n) => n.status === "autorizada")
        .reduce((acc, n) => acc + (n.valor_total || 0), 0),
    };
  }, [nfeList]);

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
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Total de Notas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.autorizadas}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendentes}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold font-mono">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(stats.valorTotal)}
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredNFes.length === 0 ? (
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
                    <TableCell className="font-medium">
                      {nfe.numero || "-"}
                    </TableCell>
                    <TableCell>{nfe.serie || "1"}</TableCell>
                    <TableCell>{nfe.pessoas?.nome || "Cliente não identificado"}</TableCell>
                    <TableCell>
                      {nfe.data_emissao 
                        ? new Date(nfe.data_emissao).toLocaleDateString("pt-BR")
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(nfe.valor_total || 0)}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfe.status)}</TableCell>
                    <TableCell className="text-right">
                      <NFeActionsMenu
                        status={nfe.status || "rascunho"}
                        chaveAcesso={nfe.chave_acesso || ""}
                        onView={() => navigate(`/fiscal/nfe/${nfe.id}`)}
                      />
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
