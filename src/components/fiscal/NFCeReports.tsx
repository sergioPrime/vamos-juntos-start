import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { useNFCe } from "@/hooks/useNFCe";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export function NFCeReports() {
  const { nfces } = useNFCe();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("summary");

  const filteredNFCes = nfces?.filter((nfce) => {
    if (!startDate || !endDate) return true;
    const nfceDate = new Date(nfce.data_emissao);
    return nfceDate >= new Date(startDate) && nfceDate <= new Date(endDate);
  });

  const totalNFCes = filteredNFCes?.length || 0;
  const authorized = filteredNFCes?.filter((n) => n.status === "autorizada").length || 0;
  const cancelled = filteredNFCes?.filter((n) => n.status === "cancelada").length || 0;
  const rejected = filteredNFCes?.filter((n) => n.status === "rejeitada").length || 0;
  const totalValue =
    filteredNFCes?.reduce((sum, nfce) => sum + (nfce.valor_total || 0), 0) || 0;
  const averageValue = totalNFCes > 0 ? totalValue / totalNFCes : 0;

  const exportReport = () => {
    if (!filteredNFCes || filteredNFCes.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const csv = [
      ["Número", "Data", "Destinatário", "Valor", "Status"].join(";"),
      ...filteredNFCes.map((nfce) =>
        [
          nfce.numero,
          format(new Date(nfce.data_emissao), "dd/MM/yyyy"),
          nfce.destinatario_nome,
          nfce.valor_total,
          nfce.status,
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-nfce-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalNFCes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Autorizadas</p>
              <p className="text-2xl font-bold">{authorized}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-2xl font-bold">{cancelled}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Rejeitadas</p>
              <p className="text-2xl font-bold">{rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gerar Relatório</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="reportType">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumo</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </Card>

          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
            <p className="text-2xl font-bold">{formatCurrency(averageValue)}</p>
          </Card>
        </div>

        <Button onClick={exportReport} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório (CSV)
        </Button>
      </Card>
    </div>
  );
}
