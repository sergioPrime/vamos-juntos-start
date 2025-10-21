import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LotManagementPanel } from '@/components/inventory/LotManagementPanel';
import { SerialNumberTracker } from '@/components/inventory/SerialNumberTracker';
import { ExpirationAlertsPanel } from '@/components/inventory/ExpirationAlertsPanel';
import { Package, Hash, AlertTriangle } from 'lucide-react';

export default function LotSerial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lotes e Números de Série</h1>
        <p className="text-muted-foreground">
          Gerenciamento completo de lotes e rastreamento de produtos
        </p>
      </div>

      <Tabs defaultValue="lots" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lots" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="serials" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Números de Série
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas de Vencimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="mt-6">
          <LotManagementPanel />
        </TabsContent>

        <TabsContent value="serials" className="mt-6">
          <SerialNumberTracker />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <ExpirationAlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
