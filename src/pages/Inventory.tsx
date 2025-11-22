import { useState } from "react"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"
import { useOrganization } from "@/hooks/useOrganization"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, RotateCcw, BarChart3, Bell } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryAlertCenter } from "@/components/inventory/InventoryAlertCenter"

const Inventory = () => {
  usePermissionCheck('estoque', 'read')
  const { currentOrg, loading: orgLoading } = useOrganization()
  const [activeTab, setActiveTab] = useState("alertas")

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando estoque...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar o estoque.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container container mx-auto p-6 space-y-6">
      {/* Header com ações rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Controle total do seu inventário e movimentações
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/inventory/entry', '_blank')}>
            <TrendingUp className="mr-2 h-4 w-4 text-success" />
            Entrada
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/inventory/exit', '_blank')}>
            <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
            Saída
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/inventory/transfer', '_blank')}>
            <RotateCcw className="mr-2 h-4 w-4 text-primary" />
            Transferência
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/inventory/reports', '_blank')}>
            <BarChart3 className="mr-2 h-4 w-4 text-chart-3" />
            Relatórios
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/inventory/alerts', '_blank')}>
            <Bell className="mr-2 h-4 w-4 text-warning" />
            Alertas
          </Button>
        </div>
      </div>
      
      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Componente de listagem de produtos será implementado na próxima sprint.
            </p>
          </div>
        </TabsContent>

        {/* Tab: Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Componente de movimentações será implementado na próxima sprint.
            </p>
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alertas">
          <InventoryAlertCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Inventory
