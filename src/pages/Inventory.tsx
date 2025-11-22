import { useState } from "react"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"
import { useOrganization } from "@/hooks/useOrganization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryStats } from "@/components/inventory/InventoryStats"
import { InventoryFilters } from "@/components/inventory/InventoryFilters"
import { InventoryProductsTable } from "@/components/inventory/InventoryProductsTable"
import { StockMovementsTable } from "@/components/inventory/StockMovementsTable"
import { InventoryAlertCenter } from "@/components/inventory/InventoryAlertCenter"

const Inventory = () => {
  usePermissionCheck('estoque', 'read')
  const { currentOrg, loading: orgLoading } = useOrganization()
  const [activeTab, setActiveTab] = useState("produtos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

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
      <InventoryHeader />
      
      {/* Estatísticas em tempo real */}
      <InventoryStats />
      
      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <InventoryProductsTable
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </TabsContent>

        {/* Tab: Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <StockMovementsTable />
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
