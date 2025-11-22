import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Printer, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CCe {
  id: string;
  sequencia: number;
  correcao: string;
  protocolo: string | null;
  data_evento: string;
  status: "pendente" | "registrado" | "rejeitado";
}

interface NFeCCeHistoryProps {
  nfeId: string;
  chaveAcesso: string;
}

export default function NFeCCeHistory({ nfeId, chaveAcesso }: NFeCCeHistoryProps) {
  const [cceList, setCceList] = useState<CCe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCCeHistory();
  }, [nfeId]);

  const loadCCeHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_nfe_cce')
        .select('*')
        .eq('nfe_id', nfeId)
        .order('sequencia', { ascending: false });

      if (error) throw error;

      setCceList((data as any) || []);
    } catch (error) {
      console.error('Error loading CCe history:', error);
      toast.error("Erro ao carregar histórico de correções");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: CCe["status"]) => {
    const variants = {
      pendente: "secondary",
      registrado: "default",
      rejeitado: "destructive",
    };

    const labels = {
      pendente: "Pendente",
      registrado: "Registrado",
      rejeitado: "Rejeitado",
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const handleDownload = async (cce: CCe) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-cce-pdf', {
        body: { cceId: cce.id, nfeId, chaveAcesso }
      });

      if (error) throw error;

      const blob = new Blob([data.html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CCe-Seq${cce.sequencia}-${chaveAcesso.substring(25, 34)}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("CCe baixada com sucesso");
    } catch (error) {
      console.error('Error downloading CCe:', error);
      toast.error("Erro ao baixar CCe");
    }
  };

  const handlePrint = async (cce: CCe) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-cce-pdf', {
        body: { cceId: cce.id, nfeId, chaveAcesso }
      });

      if (error) throw error;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast.success("CCe preparada para impressão");
    } catch (error) {
      console.error('Error printing CCe:', error);
      toast.error("Erro ao imprimir CCe");
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (cceList.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhuma Carta de Correção emitida</p>
          <p className="text-sm mt-1">
            As correções emitidas para esta NFe aparecerão aqui
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Cartas de Correção ({cceList.length})
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Correções eletrônicas emitidas para esta NFe
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Sequência</TableHead>
            <TableHead>Correção</TableHead>
            <TableHead className="w-[150px]">Data/Hora</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[180px]">Protocolo</TableHead>
            <TableHead className="text-right w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cceList.map((cce) => (
            <TableRow key={cce.id}>
              <TableCell className="font-medium">
                #{cce.sequencia}
              </TableCell>
              <TableCell className="max-w-md">
                <div className="line-clamp-2 text-sm">
                  {cce.correcao}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {new Date(cce.data_evento).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                {getStatusBadge(cce.status)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {cce.protocolo || "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(cce)}
                    title="Download CCe"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrint(cce)}
                    title="Imprimir CCe"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
