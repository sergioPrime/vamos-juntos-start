import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Server } from "lucide-react";
import { NFCeListPanel } from "@/components/pdv/NFCeListPanel";
import { NFCeContingencyPanel } from "@/components/fiscal/NFCeContingencyPanel";
import { NFCeReports } from "@/components/fiscal/NFCeReports";
import { useNFCe } from "@/hooks/useNFCe";
import { useNFCeContingency } from "@/hooks/useNFCeContingency";

export default function NFCe() {
  const { nfces, isLoading } = useNFCe();
  const { contingencyActive, queuedNFCes } = useNFCeContingency();

  const rejectedCount = nfces?.filter(n => n.status === 'rejeitada').length || 0;
  const queuedCount = queuedNFCes?.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NFC-e</h1>
          <p className="text-muted-foreground">
            Gestão completa de Notas Fiscais de Consumidor Eletrônicas
          </p>
        </div>

        <div className="flex gap-2">
          {contingencyActive && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Contingência Ativa
            </Badge>
          )}
          {queuedCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Server className="h-3 w-3" />
              {queuedCount} na fila
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Listagem
            {rejectedCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {rejectedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contingency" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Contingência
            {queuedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {queuedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="p-6">
            <NFCeListPanel />
          </Card>
        </TabsContent>

        <TabsContent value="contingency" className="space-y-4">
          <NFCeContingencyPanel />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6">
            <NFCeReports />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
