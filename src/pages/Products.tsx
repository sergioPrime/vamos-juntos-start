import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Package, HelpCircle, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  category?: string
  unit_price: number
  cost_price: number
  stock_quantity: number
  min_stock_level: number
  unit: string
  weight?: number
  dimensions?: string
  active: boolean
  created_at: string
  updated_at: string
  // New cost and pricing fields
  operational_expenses_percent?: number
  cost_with_additions?: number
  freight_purchase_percent?: number
  insurance_purchase_percent?: number
  ipi_purchase_percent?: number
  icms_purchase_percent?: number
  icms_st_purchase_percent?: number
  fcp_st_purchase_percent?: number
  minimum_sale_price?: number
  profit_amount?: number
  profit_percent?: number
  representation_commission_percent?: number
  vendor_commission_amount?: number
  vendor_commission_percent?: number
  assembly_fee_amount?: number
  assembly_fee_percent?: number
  last_purchase_value?: number
  cost_calculation_method?: string
}

const Products = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category: "",
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    unit: "un",
    weight: 0,
    dimensions: "",
    active: true,
    // New cost and pricing fields
    operational_expenses_percent: 0,
    cost_with_additions: 0,
    freight_purchase_percent: 0,
    insurance_purchase_percent: 0,
    ipi_purchase_percent: 0,
    icms_purchase_percent: 0,
    icms_st_purchase_percent: 0,
    fcp_st_purchase_percent: 0,
    minimum_sale_price: 0,
    profit_amount: 0,
    profit_percent: 0,
    representation_commission_percent: 0,
    vendor_commission_amount: 0,
    vendor_commission_percent: 0,
    assembly_fee_amount: 0,
    assembly_fee_percent: 0,
    last_purchase_value: 0,
    cost_calculation_method: "manual"
  })

  useEffect(() => {
    if (currentOrg?.id) {
      loadProducts()
    } else if (!orgLoading && !currentOrg) {
      setLoading(false)
    }
  }, [currentOrg, orgLoading])

  const loadProducts = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .order('name')

      if (error) throw error

      setProducts(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      barcode: "",
      category: "",
      unit_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      unit: "un",
      weight: 0,
      dimensions: "",
      active: true,
      operational_expenses_percent: 0,
      cost_with_additions: 0,
      freight_purchase_percent: 0,
      insurance_purchase_percent: 0,
      ipi_purchase_percent: 0,
      icms_purchase_percent: 0,
      icms_st_purchase_percent: 0,
      fcp_st_purchase_percent: 0,
      minimum_sale_price: 0,
      profit_amount: 0,
      profit_percent: 0,
      representation_commission_percent: 0,
      vendor_commission_amount: 0,
      vendor_commission_percent: 0,
      assembly_fee_amount: 0,
      assembly_fee_percent: 0,
      last_purchase_value: 0,
      cost_calculation_method: "manual"
    })
    setEditingProduct(null)
  }

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        unit_price: product.unit_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        unit: product.unit,
        weight: product.weight || 0,
        dimensions: product.dimensions || "",
        active: product.active,
        operational_expenses_percent: product.operational_expenses_percent || 0,
        cost_with_additions: product.cost_with_additions || 0,
        freight_purchase_percent: product.freight_purchase_percent || 0,
        insurance_purchase_percent: product.insurance_purchase_percent || 0,
        ipi_purchase_percent: product.ipi_purchase_percent || 0,
        icms_purchase_percent: product.icms_purchase_percent || 0,
        icms_st_purchase_percent: product.icms_st_purchase_percent || 0,
        fcp_st_purchase_percent: product.fcp_st_purchase_percent || 0,
        minimum_sale_price: product.minimum_sale_price || 0,
        profit_amount: product.profit_amount || 0,
        profit_percent: product.profit_percent || 0,
        representation_commission_percent: product.representation_commission_percent || 0,
        vendor_commission_amount: product.vendor_commission_amount || 0,
        vendor_commission_percent: product.vendor_commission_percent || 0,
        assembly_fee_amount: product.assembly_fee_amount || 0,
        assembly_fee_percent: product.assembly_fee_percent || 0,
        last_purchase_value: product.last_purchase_value || 0,
        cost_calculation_method: product.cost_calculation_method || "manual"
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do produto é obrigatório.",
        variant: "destructive",
      })
      return
    }

    try {
      const productData = {
        ...formData,
        org_id: currentOrg?.id,
        owner_id: user?.id,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error

        toast({
          title: "Produto atualizado",
          description: "Produto atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error

        toast({
          title: "Produto criado",
          description: "Produto criado com sucesso.",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      loadProducts()
    } catch (error) {
      toast({
        title: "Erro ao salvar produto",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso.",
      })

      loadProducts()
    } catch (error) {
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      })
    }
  }

  // Calculation functions
  const calculateCostWithAdditions = () => {
    const base = formData.cost_price || 0
    const operational = (base * (formData.operational_expenses_percent || 0)) / 100
    const freight = (base * (formData.freight_purchase_percent || 0)) / 100
    const insurance = (base * (formData.insurance_purchase_percent || 0)) / 100
    const ipi = (base * (formData.ipi_purchase_percent || 0)) / 100
    const icms = (base * (formData.icms_purchase_percent || 0)) / 100
    const icmsSt = (base * (formData.icms_st_purchase_percent || 0)) / 100
    const fcpSt = (base * (formData.fcp_st_purchase_percent || 0)) / 100
    
    return base + operational + freight + insurance + ipi + icms + icmsSt + fcpSt
  }

  const calculateProfitFromSalePrice = () => {
    const salePrice = formData.unit_price || 0
    const costWithAdditions = calculateCostWithAdditions()
    const profitAmount = salePrice - costWithAdditions
    const profitPercent = costWithAdditions > 0 ? (profitAmount / costWithAdditions) * 100 : 0
    
    return { profitAmount, profitPercent }
  }

  const updateFormField = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value }
    
    // Auto-calculate cost with additions
    if (['cost_price', 'operational_expenses_percent', 'freight_purchase_percent', 
         'insurance_purchase_percent', 'ipi_purchase_percent', 'icms_purchase_percent',
         'icms_st_purchase_percent', 'fcp_st_purchase_percent'].includes(field)) {
      const base = field === 'cost_price' ? value : formData.cost_price || 0
      const operational = (base * (field === 'operational_expenses_percent' ? value : formData.operational_expenses_percent || 0)) / 100
      const freight = (base * (field === 'freight_purchase_percent' ? value : formData.freight_purchase_percent || 0)) / 100
      const insurance = (base * (field === 'insurance_purchase_percent' ? value : formData.insurance_purchase_percent || 0)) / 100
      const ipi = (base * (field === 'ipi_purchase_percent' ? value : formData.ipi_purchase_percent || 0)) / 100
      const icms = (base * (field === 'icms_purchase_percent' ? value : formData.icms_purchase_percent || 0)) / 100
      const icmsSt = (base * (field === 'icms_st_purchase_percent' ? value : formData.icms_st_purchase_percent || 0)) / 100
      const fcpSt = (base * (field === 'fcp_st_purchase_percent' ? value : formData.fcp_st_purchase_percent || 0)) / 100
      
      newFormData.cost_with_additions = base + operational + freight + insurance + ipi + icms + icmsSt + fcpSt
    }
    
    // Auto-calculate profit when sale price changes
    if (field === 'unit_price') {
      const costWithAdditions = newFormData.cost_with_additions || calculateCostWithAdditions()
      const profitAmount = value - costWithAdditions
      const profitPercent = costWithAdditions > 0 ? (profitAmount / costWithAdditions) * 100 : 0
      
      newFormData.profit_amount = profitAmount
      newFormData.profit_percent = profitPercent
    }
    
    // Auto-calculate sale price when profit amount changes
    if (field === 'profit_amount') {
      const costWithAdditions = newFormData.cost_with_additions || calculateCostWithAdditions()
      const salePrice = costWithAdditions + value
      const profitPercent = costWithAdditions > 0 ? (value / costWithAdditions) * 100 : 0
      
      newFormData.unit_price = salePrice
      newFormData.profit_percent = profitPercent
    }
    
    // Auto-calculate sale price when profit percent changes
    if (field === 'profit_percent') {
      const costWithAdditions = newFormData.cost_with_additions || calculateCostWithAdditions()
      const profitAmount = (costWithAdditions * value) / 100
      const salePrice = costWithAdditions + profitAmount
      
      newFormData.profit_amount = profitAmount
      newFormData.unit_price = salePrice
    }
    
    setFormData(newFormData)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Show loading if organization is still loading or if products are loading
  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    )
  }

  // Show message if no organization is found
  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para gerenciar produtos.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed header with buttons */}
      <div className="flex justify-between items-center p-6 border-b bg-background">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm || selectedCategory !== "all"
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Tente alterar os filtros de busca"
                : "Comece criando seu primeiro produto"}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {product.sku && (
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                    </div>
                  )}
                  {product.category && (
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">
                      R$ {product.unit_price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>
                  {product.stock_quantity <= product.min_stock_level && (
                    <Badge variant="destructive" className="text-xs">
                      Estoque baixo
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex justify-between items-center">
              <span>{editingProduct ? "Editar Produto" : "Novo Produto"}</span>
              <div className="flex gap-2">
                <Button type="submit" form="product-form">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <TooltipProvider>
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados do Produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => updateFormField('sku', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="barcode">Código de Barras</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => updateFormField('barcode', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => updateFormField('category', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="unit_price">Preço de Venda (R$)</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Preço final de venda do produto</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => updateFormField('unit_price', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Custo base do produto</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_price}
                        onChange={(e) => updateFormField('cost_price', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unidade</Label>
                      <Select value={formData.unit} onValueChange={(value) => updateFormField('unit', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="g">Grama</SelectItem>
                          <SelectItem value="l">Litro</SelectItem>
                          <SelectItem value="ml">Mililitro</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="cm">Centímetro</SelectItem>
                          <SelectItem value="m2">Metro Quadrado</SelectItem>
                          <SelectItem value="m3">Metro Cúbico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => updateFormField('stock_quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock_level">Estoque Mínimo</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={(e) => updateFormField('min_stock_level', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => updateFormField('weight', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensões</Label>
                      <Input
                        id="dimensions"
                        placeholder="Ex: 10x20x30 cm"
                        value={formData.dimensions}
                        onChange={(e) => updateFormField('dimensions', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Custos e Precificação Accordion */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="custos">
                    <AccordionTrigger className="text-lg font-semibold">
                      Custos e Precificação
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6">
                      {/* Custos Base */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium">Custos Base</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="operational_expenses">Desp. Operacionais (%)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Percentual de despesas operacionais</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="operational_expenses"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.operational_expenses_percent}
                              onChange={(e) => updateFormField('operational_expenses_percent', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="cost_with_additions">Preço de Custo com Acréscimos (R$)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Custo total incluindo todos os acréscimos (calculado automaticamente)</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="cost_with_additions"
                              type="number"
                              step="0.01"
                              value={formData.cost_with_additions.toFixed(2)}
                              readOnly
                              className="bg-muted text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custos de Compra */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium">Custos de Compra</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="freight_purchase">Frete pago na Compra (%)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Percentual do frete pago na compra</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="freight_purchase"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.freight_purchase_percent}
                              onChange={(e) => updateFormField('freight_purchase_percent', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="insurance_purchase">Seguro pago na Compra (%)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Percentual do seguro pago na compra</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="insurance_purchase"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.insurance_purchase_percent}
                              onChange={(e) => updateFormField('insurance_purchase_percent', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="ipi_purchase">IPI pago na Compra (%)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Percentual do IPI pago na compra</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="ipi_purchase"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.ipi_purchase_percent}
                              onChange={(e) => updateFormField('ipi_purchase_percent', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Margem de Lucro */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium">Margem de Lucro</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="profit_amount">Lucro (R$)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor do lucro em reais</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="profit_amount"
                              type="number"
                              step="0.01"
                              value={formData.profit_amount}
                              onChange={(e) => updateFormField('profit_amount', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="profit_percent">Lucro (%)</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Percentual de lucro sobre o custo</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id="profit_percent"
                              type="number"
                              step="0.01"
                              value={formData.profit_percent}
                              onChange={(e) => updateFormField('profit_percent', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </form>
            </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Products