import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  brand?: string
  validity_days?: number
  product_type?: string
  model?: string
  sale_unit?: string
  system_code?: string
  supplier_code?: string
  supplier_id?: string
  sku?: string
  category?: string
  product_genre?: string
  inactive?: boolean
  hide_in_sales?: boolean
  visible_in_catalog?: boolean
  description?: string
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
  org_id: string
  owner_id: string
}

interface Supplier {
  id: string
  name: string
}

const PRODUCT_TYPES = [
  { value: "simple", label: "Simples" },
  { value: "compound", label: "Composto" },
  { value: "service", label: "Serviço" },
]

const SALE_UNITS = [
  { value: "unit", label: "Unidade" },
  { value: "weight", label: "Peso" },
  { value: "meter", label: "Metro" },
  { value: "liter", label: "Litro" },
  { value: "m2", label: "Metro Quadrado" },
  { value: "m3", label: "Metro Cúbico" },
]

const PRODUCT_GENRES = [
  { value: "00", label: "00 - Mercadoria para Revenda" },
  { value: "01", label: "01 - Matéria-Prima" },
  { value: "02", label: "02 - Embalagem" },
  { value: "03", label: "03 - Produto em Processo" },
  { value: "04", label: "04 - Produto Acabado" },
  { value: "05", label: "05 - Subproduto" },
  { value: "06", label: "06 - Produto Intermediário" },
  { value: "07", label: "07 - Material de Uso e Consumo" },
  { value: "08", label: "08 - Ativo Imobilizado" },
  { value: "09", label: "09 - Serviços" },
  { value: "10", label: "10 - Outros Insumos" },
  { value: "99", label: "99 - Outras" },
]

const Products = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    validity_days: 0,
    product_type: "simple",
    model: "",
    sale_unit: "unit",
    system_code: "",
    supplier_code: "",
    supplier_id: "",
    sku: "",
    category: "",
    product_genre: "00",
    inactive: false,
    hide_in_sales: false,
    visible_in_catalog: true,
    description: "",
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    unit: "un",
    weight: 0,
    dimensions: "",
    active: true,
  })

  useEffect(() => {
    if (currentOrg?.id) {
      loadProducts()
      loadSuppliers()
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

  const loadSuppliers = async () => {
    if (!currentOrg?.id) return
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('org_id', currentOrg?.id)
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      validity_days: 0,
      product_type: "simple",
      model: "",
      sale_unit: "unit",
      system_code: "",
      supplier_code: "",
      supplier_id: "",
      sku: "",
      category: "",
      product_genre: "00",
      inactive: false,
      hide_in_sales: false,
      visible_in_catalog: true,
      description: "",
      unit_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      unit: "un",
      weight: 0,
      dimensions: "",
      active: true,
    })
    setEditingProduct(null)
  }

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        brand: product.brand || "",
        validity_days: product.validity_days || 0,
        product_type: product.product_type || "simple",
        model: product.model || "",
        sale_unit: product.sale_unit || "unit",
        system_code: product.system_code || "",
        supplier_code: product.supplier_code || "",
        supplier_id: product.supplier_id || "",
        sku: product.sku || "",
        category: product.category || "",
        product_genre: product.product_genre || "00",
        inactive: product.inactive || false,
        hide_in_sales: product.hide_in_sales || false,
        visible_in_catalog: product.visible_in_catalog !== false,
        description: product.description || "",
        unit_price: product.unit_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        unit: product.unit,
        weight: product.weight || 0,
        dimensions: product.dimensions || "",
        active: product.active,
      })
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações obrigatórias
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do produto é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.product_type) {
      toast({
        title: "Tipo de produto obrigatório",
        description: "O tipo de produto é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.product_genre) {
      toast({
        title: "Tipo/Gênero obrigatório",
        description: "O tipo/gênero é obrigatório.",
        variant: "destructive",
      })
      return
    }

    try {
      const productData = {
        ...formData,
        org_id: currentOrg?.id,
        owner_id: user?.id,
        // Garantir que valores numéricos sejam válidos
        min_stock_level: Number(formData.min_stock_level) || 0,
        stock_quantity: Number(formData.stock_quantity) || 0,
        unit_price: Number(formData.unit_price) || 0,
        cost_price: Number(formData.cost_price) || 0,
        validity_days: Number(formData.validity_days) || 0,
        weight: Number(formData.weight) || 0,
      }

      console.log('Dados do produto a serem salvos:', productData)

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) {
          console.error('Erro detalhado:', error)
          throw error
        }

        toast({
          title: "Produto atualizado",
          description: "Produto atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) {
          console.error('Erro detalhado:', error)
          throw error
        }

        toast({
          title: "Produto criado",
          description: "Produto criado com sucesso.",
        })
      }

      setShowForm(false)
      resetForm()
      loadProducts()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro ao salvar produto",
        description: error?.message || "Ocorreu um erro ao salvar o produto.",
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


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           product.category === selectedCategory
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

  if (showForm) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Fixed header with buttons */}
        <div className="flex justify-between items-center p-6 border-b bg-background">
          <h1 className="text-3xl font-bold">
            {editingProduct ? "Editar Produto" : "Novo Produto"}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 p-6 overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="outros" disabled className="opacity-50">
                  Outros (Em breve)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dados" className="space-y-6 mt-6">
                {/* Primeira linha */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">Nome do Produto</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome do produto"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Digite a marca"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="validity_days">Validade (dias)</Label>
                    <Input
                      id="validity_days"
                      type="number"
                      value={formData.validity_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Segunda linha */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="product_type" className="required">Tipo do Produto</Label>
                    <Select 
                      value={formData.product_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Digite o modelo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sale_unit">Produto é vendido por</Label>
                    <Select 
                      value={formData.sale_unit} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sale_unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALE_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Terceira linha */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="system_code">Código do Sistema</Label>
                    <Input
                      id="system_code"
                      value={formData.system_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, system_code: e.target.value }))}
                      placeholder="Código automático"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier_code">Código do Fornecedor</Label>
                    <Input
                      id="supplier_code"
                      value={formData.supplier_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_code: e.target.value }))}
                      placeholder="Digite o código"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Fornecedor Padrão</Label>
                    <Select 
                      value={formData.supplier_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quarta linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sku">Código do Produto (SKU)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Digite o SKU"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Digite a categoria"
                    />
                  </div>
                </div>

                {/* Quinta linha */}
                <div className="space-y-2">
                  <Label htmlFor="product_genre" className="required">Tipo/Gênero</Label>
                  <Select 
                    value={formData.product_genre} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_genre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo/gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_GENRES.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Switches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="inactive"
                      checked={formData.inactive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inactive: checked }))}
                    />
                    <Label htmlFor="inactive">Cadastro Inativo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hide_in_sales"
                      checked={formData.hide_in_sales}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hide_in_sales: checked }))}
                    />
                    <Label htmlFor="hide_in_sales">Ocultar nas Vendas</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="visible_in_catalog"
                      checked={formData.visible_in_catalog}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible_in_catalog: checked }))}
                    />
                    <Label htmlFor="visible_in_catalog">Visível no Catálogo</Label>
                  </div>
                </div>

                {/* Accordion para Custos e Precificação */}
                <Accordion type="single" collapsible className="w-full border rounded-lg">
                  <AccordionItem value="pricing">
                    <AccordionTrigger className="px-4">Custos e Precificação</AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="cost_price">Preço de Custo</Label>
                          <Input
                            id="cost_price"
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="unit_price">Preço de Venda</Label>
                          <Input
                            id="unit_price"
                            type="number"
                            step="0.01"
                            value={formData.unit_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                          <Input
                            id="stock_quantity"
                            type="number"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="min_stock_level">Estoque Mínimo</Label>
                          <Input
                            id="min_stock_level"
                            type="number"
                            value={formData.min_stock_level}
                            onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidade</Label>
                          <Input
                            id="unit"
                            value={formData.unit}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="un"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container w-full h-full flex flex-col">
      {/* Fixed header with buttons */}
      <div className="flex justify-between items-center p-6 border-b bg-background">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={() => openForm()}>
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
              <Button onClick={() => openForm()}>
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
                        onClick={() => openForm(product)}
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
                  {product.sku && (
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Preço:</span>
                      <span className="font-medium">
                        R$ {product.unit_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estoque:</span>
                      <span className={`font-medium ${
                        product.stock_quantity <= (product.min_stock_level || 0)
                          ? 'text-destructive'
                          : 'text-foreground'
                      }`}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                      {!product.active && (
                        <Badge variant="destructive" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products