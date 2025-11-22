import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2 } from "lucide-react";
import { useNFCeContingency } from "@/hooks/useNFCeContingency";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function NFCeContingencyQueue() {
  const { queuedNFCes, removeFromQueue, transmitQueue } = useNFCeContingency();

  if (!queuedNFCes || queuedNFCes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma NFC-e na fila de contingência
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Tentativas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queuedNFCes.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.nfce_data?.numero || "-"}
              </TableCell>
              <TableCell>
                {item.created_at && format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {formatCurrency(item.nfce_data?.valor_total || 0)}
              </TableCell>
              <TableCell>
                <Badge variant={item.retry_count > 2 ? "destructive" : "secondary"}>
                  {item.retry_count} tentativa(s)
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{item.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => transmitQueue.mutate()}
                    disabled={transmitQueue.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromQueue.mutate(item.id)}
                    disabled={removeFromQueue.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
