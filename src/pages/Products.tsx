import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, Save, ChevronDown, Check, Circle, Filter, MoreVertical, BookOpen, MessageSquare } from "lucide-react"
import styles from "./Products.module.css"
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
import { cn } from "@/lib/utils"

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
      <div className="w-full h-full flex flex-col bg-white">
        {/* Fixed header with breadcrumb and title */}
        <div className={styles.productHeader}>
          <div className={styles.productBreadcrumb}>
            <BookOpen className={styles.productBreadcrumbIcon} />
            <span>Cadastros &gt;</span>
          </div>
          <h1 className={styles.productTitle}>
            Produtos - {editingProduct ? editingProduct.name : "Novo Produto"}
          </h1>
        </div>

        {/* Action buttons bar */}
        <div className="flex justify-end items-center px-6 py-4 bg-white border-b" style={{ borderColor: '#EEEEEE' }}>
          <div className={styles.actionsBar}>
            <button className={styles.btnFeedback}>
              <MessageSquare className="inline-block mr-2 w-4 h-4" />
              Enviar Feedback
            </button>
            <button className={styles.btnMoreActions}>
              <span>Mais Ações</span>
              <ChevronDown className={styles.btnMoreActionsIcon} />
            </button>
            <button className={styles.btnSave} onClick={handleSubmit}>
              <Save className="inline-block mr-2 w-4 h-4" />
              Salvar
            </button>
            <button className={styles.btnBack} onClick={() => setShowForm(false)}>
              <ArrowLeft className="inline-block mr-2 w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: '#FAFAFA' }}>
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <form onSubmit={handleSubmit}>
              {/* Tabs customizadas */}
              <div className="mb-6">
                <div className="border-b" style={{ borderColor: '#EEEEEE' }}>
                  <div className="flex">
                    <button 
                      type="button"
                      className={`${styles.tabTrigger} ${styles.tabTriggerActive}`}
                      style={{ marginRight: '2px' }}
                    >
                      Dados
                    </button>
                    <button 
                      type="button"
                      className={styles.tabTrigger}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    >
                      Outros (Em breve)
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className={styles.formContainer}>
                {/* Primeira linha - Nome, Tipo e Gênero */}
                <div className={styles.formGrid}>
                  <div>
                    <label htmlFor="name" className={styles.formLabel}>
                      Nome do Produto <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={styles.formInput}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome do produto"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product_type" className={styles.formLabel}>
                      Tipo do Produto <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <Select 
                      value={formData.product_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
                    >
                      <SelectTrigger className={styles.formSelect}>
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

                  <div>
                    <label htmlFor="product_genre" className={styles.formLabel}>
                      Tipo/Gênero <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <Select 
                      value={formData.product_genre} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_genre: value }))}
                    >
                      <SelectTrigger className={styles.formSelect}>
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

                {/* Segunda linha - Código Sistema, Código Produto e Marca */}
                <div className={styles.formGrid}>
                  <div>
                    <label htmlFor="system_code" className={styles.formLabel}>
                      Código do Sistema
                    </label>
                    <input
                      id="system_code"
                      type="text"
                      className={`${styles.formInput} ${styles.formInputDisabled}`}
                      value={formData.system_code || ''}
                      disabled
                      placeholder="Auto-gerado"
                    />
                  </div>

                  <div>
                    <label htmlFor="sku" className={styles.formLabel}>
                      Código do Produto (SKU) <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="sku"
                      type="text"
                      className={styles.formInput}
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                      placeholder="Código alfanumérico"
                      required
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="brand" className={styles.formLabel}>
                      Marca
                    </label>
                    <input
                      id="brand"
                      type="text"
                      className={styles.formInput}
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Digite a marca"
                    />
                  </div>
                </div>

                {/* Terceira linha - Modelo, Validade e Vendido Por */}
                <div className={styles.formGrid}>
                  <div>
                    <label htmlFor="model" className={styles.formLabel}>
                      Modelo
                    </label>
                    <input
                      id="model"
                      type="text"
                      className={styles.formInput}
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Digite o modelo"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="validity_days" className={styles.formLabel}>
                      Validade (dias)
                    </label>
                    <input
                      id="validity_days"
                      type="number"
                      className={styles.formInput}
                      value={formData.validity_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="sale_unit" className={styles.formLabel}>
                      Produto é vendido por
                    </label>
                    <Select 
                      value={formData.sale_unit} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sale_unit: value }))}
                    >
                      <SelectTrigger className={styles.formSelect}>
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

                {/* Quarta linha - Código Fornecedor Padrão e Fornecedor Padrão */}
                <div className={styles.formGrid2Col}>
                  <div>
                    <label htmlFor="supplier_code" className={styles.formLabel}>
                      Código Fornecedor Padrão
                    </label>
                    <input
                      id="supplier_code"
                      type="text"
                      className={`${styles.formInput} ${styles.formInputDisabled}`}
                      value={formData.supplier_code}
                      disabled
                      placeholder=""
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="supplier_id" className={styles.formLabel}>
                      Fornecedor Padrão
                    </label>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={formData.supplier_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                      >
                        <SelectTrigger className={styles.formSelect}>
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
                      <button 
                        type="button" 
                        className={styles.iconButton}
                        title="Editar fornecedor"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Switches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                <div className="mt-6">
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
                </div>
              </div>
            </form>
          </div>
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
        <div className="bg-background rounded border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="w-[40px] h-10 px-3">
                  <Checkbox 
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-muted-foreground"
                  />
                </TableHead>
                <TableHead className="w-[40px] h-10 px-2">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </TableHead>
                <TableHead className="w-[60px] h-10 px-3 text-xs font-semibold text-foreground">Tipo</TableHead>
                <TableHead className="w-[100px] h-10 px-3 text-xs font-semibold text-foreground">
                  Cód. Sistema
                  <ChevronDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-semibold text-foreground">Código SKU</TableHead>
                <TableHead className="h-10 px-3 text-xs font-semibold text-foreground">Nome</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-semibold text-foreground text-center">Visível Vendas</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-semibold text-foreground">Marca</TableHead>
                <TableHead className="w-[120px] h-10 px-3 text-xs font-semibold text-foreground">Modelo</TableHead>
                <TableHead className="w-[140px] h-10 px-3 text-xs font-semibold text-foreground">Fornecedor</TableHead>
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
                filteredProducts.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <TableCell className="px-3 py-2.5">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        className="border-muted-foreground"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-sm font-medium text-foreground">{product.system_code || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-primary font-semibold">{product.sku || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm font-medium text-foreground">{product.name}</TableCell>
                    <TableCell className="px-3 py-2.5 text-center">
                      {!product.hide_in_sales && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground">{product.brand || ""}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground">{product.model || ""}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground">{getSupplierName(product.supplier_id)}</TableCell>
                    <TableCell className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-muted"
                          onClick={() => openForm(product)}
                        >
                          <Edit className="h-3.5 w-3.5 text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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