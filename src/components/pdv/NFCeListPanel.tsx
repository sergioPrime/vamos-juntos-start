import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Search, Eye, X, RefreshCw, Download } from "lucide-react";
import { useNFCe } from "@/hooks/useNFCe";
import { NFCeViewDialog } from "@/components/fiscal/NFCeViewDialog";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function NFCeListPanel() {
  const { nfces, isLoading, consultStatus } = useNFCe();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNFCe, setSelectedNFCe] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      autorizada: "default",
      processando: "secondary",
      rejeitada: "destructive",
      cancelada: "outline",
    };

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredNFCes = nfces?.filter((nfce) => {
    const search = searchTerm.toLowerCase();
    return (
      nfce.numero?.toString().includes(search) ||
      nfce.chave_acesso?.toLowerCase().includes(search) ||
      nfce.destinatario_nome?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, chave ou destinatário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredNFCes && filteredNFCes.length > 0 ? (
              filteredNFCes.map((nfce) => (
                <TableRow key={nfce.id}>
                  <TableCell className="font-medium">{nfce.numero}</TableCell>
                  <TableCell>
                    {nfce.data_emissao && format(new Date(nfce.data_emissao), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{nfce.destinatario_nome}</TableCell>
                  <TableCell>{formatCurrency(nfce.valor_total || 0)}</TableCell>
                  <TableCell>{getStatusBadge(nfce.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedNFCe(nfce)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => consultStatus.mutate(nfce.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {nfce.xml_path && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(nfce.xml_path, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma NFC-e encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedNFCe && (
        <NFCeViewDialog
          nfce={selectedNFCe}
          open={!!selectedNFCe}
          onClose={() => setSelectedNFCe(null)}
        />
      )}
    </div>
  );
}
