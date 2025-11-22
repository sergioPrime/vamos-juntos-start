import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NFCeListPanel } from '@/components/pdv/NFCeListPanel';
import { NFCeContingencyPanel } from '@/components/fiscal/NFCeContingencyPanel';
import { NFCeReports } from '@/components/fiscal/NFCeReports';
import { useNFCeContingency } from '@/hooks/useNFCeContingency';
import { useOrganization } from '@/hooks/useOrganization';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  BarChart3,
  Settings
} from 'lucide-react';
import { useEffect } from 'react';

export default function NFCe() {
  const { currentOrg } = useOrganization();
  const { isContingencyActive, checkContingencyStatus, contingencyQueue } = useNFCeContingency();
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    if (currentOrg?.id) {
      checkContingencyStatus(currentOrg.id);
    }
  }, [currentOrg?.id]);

  const pendingQueueCount = contingencyQueue.filter(
    item => item.status === 'pending' || item.status === 'failed'
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NFC-e</h1>
          <p className="text-muted-foreground">
            Gestão de Notas Fiscais de Consumidor Eletrônicas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isContingencyActive && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Contingência Ativa
            </Badge>
          )}
          
          {pendingQueueCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              {pendingQueueCount} NFC-e na fila
            </Badge>
          )}
        </div>
      </div>

      {/* Alert when contingency is active */}
      {isContingencyActive && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Modo Contingência Ativo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  As NFC-e estão sendo emitidas em modo offline. Elas serão transmitidas
                  automaticamente quando a conexão com a SEFAZ for restabelecida.
                  {pendingQueueCount > 0 && ` Há ${pendingQueueCount} NFC-e aguardando transmissão.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="gap-2">
            <FileText className="h-4 w-4" />
            NFC-e Emitidas
          </TabsTrigger>
          
          <TabsTrigger value="contingency" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Contingência
            {pendingQueueCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                {pendingQueueCount}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NFC-e Emitidas</CardTitle>
              <CardDescription>
                Visualize e gerencie as NFC-e emitidas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NFCeListPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contingency Tab */}
        <TabsContent value="contingency" className="space-y-4">
          <NFCeContingencyPanel />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <NFCeReports />
        </TabsContent>
      </Tabs>

      {/* Quick Access Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Fiscais
          </CardTitle>
          <CardDescription>
            Para configurar certificado digital, CSC e outras configurações fiscais,
            acesse o menu <strong>Configurações → Fiscal</strong>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
