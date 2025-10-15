import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, Save, ChevronDown, Check, Circle, Filter, MoreVertical } from "lucide-react"
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
import { usePermissionGuard } from "@/hooks/usePermissionGuard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  
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

    if (!formData.sku?.trim()) {
      toast({
        title: "Erro de validação",
        description: "SKU (Código) do produto é obrigatório.",
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
        // Garantir que campos UUID vazios sejam null
        supplier_id: formData.supplier_id?.trim() || null,
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

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione ao menos um produto para excluir.",
        variant: "destructive",
      })
      return
    }

    const confirmMessage = selectedProducts.length === 1
      ? "Tem certeza que deseja excluir o produto selecionado?"
      : `Tem certeza que deseja excluir ${selectedProducts.length} produtos selecionados?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts)

      if (error) throw error

      toast({
        title: "Produtos excluídos",
        description: `${selectedProducts.length} produto(s) excluído(s) com sucesso.`,
      })

      setSelectedProducts([])
      loadProducts()
    } catch (error) {
      toast({
        title: "Erro ao excluir produtos",
        description: "Ocorreu um erro ao excluir os produtos.",
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
                {/* Primeira linha - Nome e SKU obrigatórios */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <Label htmlFor="sku" className="required flex items-center gap-2">
                      <span>Código do Produto</span>
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                      placeholder="Código alfanumérico"
                      required
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system_code">Código do Sistema</Label>
                    <Input
                      id="system_code"
                      value={formData.system_code || ''}
                      disabled
                      placeholder="Auto-gerado"
                      className="font-mono bg-muted"
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
                </div>

                {/* Segunda linha - Tipo, Modelo e Validade */}
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

                {/* Terceira linha */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Digite a categoria"
                    />
                  </div>
                </div>

                {/* Quarta linha - Fornecedor e Gênero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="product_genre">Gênero do Produto</Label>
                    <Select 
                      value={formData.product_genre} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_genre: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
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
                </div>

                {/* Quarta linha - Fornecedor, Categoria e Descrição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Quinta linha - Descrição e Tipo/Gênero */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do produto"
                    />
                  </div>
                  
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    }
  }

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return ""
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || ""
  }

  return (
    <div className="page-container w-full h-full flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-3 bg-background border-b">
        <Package className="h-5 w-5 text-[hsl(188,85%,43%)]" />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-muted-foreground">Estoque</span>
          <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
          <span className="text-foreground font-medium text-base">Produtos</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 bg-background border-b">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-[280px]">
            <Input
              placeholder="Pesquisar por Código/Nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm pr-10 border-border"
            />
            <Button 
              size="sm" 
              className="absolute right-0 top-0 h-9 px-3 rounded-l-none bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="default" 
            size="sm"
            className="h-9 bg-[#0c5c7a] hover:bg-[#094a62] text-white text-sm px-4"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Filter className="mr-2 h-3.5 w-3.5" />
            Busca Avançada
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm">
                <ChevronDown className="mr-2 h-3.5 w-3.5" />
                Mais Ações
                {selectedProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedProducts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {selectedProducts.length > 0 && (
                <>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Produtos Selecionados ({selectedProducts.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50">
                    Exportar Selecionados
                  </DropdownMenuItem>
                </>
              )}
              {selectedProducts.length === 0 && (
                <>
                  <DropdownMenuItem disabled className="opacity-50">
                    Exportar Selecionados
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50">
                    Importar Produtos
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50">
                    Atualizar Preços
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            size="sm"
            className="h-9 bg-[#26b9d6] hover:bg-[#1fa3bd] text-white text-sm font-medium px-4"
            onClick={() => openForm()}
          >
            <Plus className="mr-2 h-4 w-4" />
            NOVO
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 py-4 overflow-auto">
        <div className="bg-white rounded border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
                <TableHead className="w-[40px] h-10 px-3">
                  <Checkbox 
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-400"
                  />
                </TableHead>
                <TableHead className="w-[40px] h-10 px-2">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </TableHead>
                <TableHead className="w-[60px] h-10 px-3 text-xs font-medium text-foreground">Tipo</TableHead>
                <TableHead className="w-[100px] h-10 px-3 text-xs font-medium text-foreground">
                  Cód. Sistema
                  <ChevronDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-medium text-foreground">Código SKU</TableHead>
                <TableHead className="h-10 px-3 text-xs font-medium text-foreground">Nome</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-medium text-foreground text-center">Visível Vendas</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-medium text-foreground">Marca</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-medium text-foreground">Modelo</TableHead>
                <TableHead className="w-[140px] h-10 px-3 text-xs font-medium text-foreground">Fornecedor</TableHead>
                <TableHead className="w-[60px] h-10 px-2 text-right">
                  <Filter className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base font-medium text-muted-foreground mb-2">
                      {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ? "Tente alterar os filtros de busca" : "Comece criando seu primeiro produto"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-[#fafafa]">
                    <TableCell className="px-3 py-2.5">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        className="border-gray-400"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      <ChevronDown className="h-3.5 w-3.5 text-[#26b9d6]" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Circle className="h-4 w-4 text-gray-400" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{product.system_code || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-[#26b9d6] font-medium">{product.sku || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{product.name}</TableCell>
                    <TableCell className="px-3 py-2.5 text-center">
                      {!product.hide_in_sales && (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{product.brand || ""}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{product.model || ""}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{getSupplierName(product.supplier_id)}</TableCell>
                    <TableCell className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-gray-100"
                          onClick={() => openForm(product)}
                        >
                          <Edit className="h-3.5 w-3.5 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-gray-100"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default Products