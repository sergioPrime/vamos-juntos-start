import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationStatus } from "@/components/integration/IntegrationStatus"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"
import { InventoryHeader } from "@/components/inventory/InventoryHeader"
import { InventoryStats } from "@/components/inventory/InventoryStats"
import { InventoryFilters } from "@/components/inventory/InventoryFilters"
import { InventoryProductsTable } from "@/components/inventory/InventoryProductsTable"
import { StockMovementsTable } from "@/components/inventory/StockMovementsTable"
import { QuickMovementDialog } from "@/components/inventory/QuickMovementDialog"

interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  unit: string
  stock_quantity: number
  min_stock_level: number
  unit_price: number
  cost_price: number
}

interface StockMovement {
  id: string
  product_id: string
  movement_type: string
  quantity: number
  notes?: string
  created_at: string
  created_by: string
  product?: {
    id: string
    name: string
    sku?: string
    unit: string
  }
}

const Inventory = () => {
  usePermissionCheck('estoque', 'read')
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrg?.id) {
      loadData()
      
      // Setup realtime subscriptions
      const stockMovementsChannel = supabase
        .channel('stock_movements_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stock_movements',
            filter: `org_id=eq.${currentOrg.id}`
          },
          () => loadData()
        )
        .subscribe()

      const productsChannel = supabase
        .channel('products_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'products',
            filter: `org_id=eq.${currentOrg.id}`
          },
          () => loadData()
        )
        .subscribe()

      return () => {
        supabase.removeChannel(stockMovementsChannel)
        supabase.removeChannel(productsChannel)
      }
    }
  }, [currentOrg])

  const loadData = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, stock_quantity, min_stock_level, unit_price, cost_price')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      const uniqueCategories = [...new Set(productsData?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)

      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, sku, unit)
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (movementsError) throw movementsError
      setStockMovements((movementsData || []) as unknown as StockMovement[])

    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do estoque.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0)
  const outOfStockProducts = products.filter(p => p.stock_quantity <= 0)
  const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0)

  if (orgLoading || loading) {
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
      <InventoryHeader
        outOfStockCount={outOfStockProducts.length}
        lowStockCount={lowStockProducts.length}
        onQuickMovementClick={() => setIsMovementDialogOpen(true)}
      />

      <IntegrationStatus />

      <InventoryStats
        totalProducts={products.length}
        lowStockCount={lowStockProducts.length}
        outOfStockCount={outOfStockProducts.length}
        totalValue={totalValue}
      />

      <InventoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <InventoryProductsTable products={filteredProducts} />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <StockMovementsTable movements={stockMovements} />
        </TabsContent>
      </Tabs>

      <QuickMovementDialog
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
        products={products}
        onSuccess={loadData}
      />
    </div>
  )
}

export default Inventory
