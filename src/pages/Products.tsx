import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    active: true
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
      active: true
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
        active: product.active
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit_price">Preço de Venda</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost_price">Preço de Custo</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unidade</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
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
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock_level">Estoque Mínimo</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="dimensions">Dimensões</Label>
                  <Input
                    id="dimensions"
                    placeholder="Ex: 10x20x30 cm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Atualizar" : "Criar"} Produto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== "all" 
              ? "Ajuste os filtros ou cadastre novos produtos." 
              : "Comece cadastrando seu primeiro produto."
            }
          </p>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">{product.name}</CardTitle>
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
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                {product.sku && (
                  <p className="text-xs text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                )}

                {product.category && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Preço:</span>
                    <span className="font-bold text-primary">
                      R$ {product.unit_price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Estoque:</span>
                    <span className={`font-medium ${
                      product.stock_quantity <= product.min_stock_level 
                        ? 'text-destructive' 
                        : 'text-foreground'
                    }`}>
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>

                  {product.stock_quantity <= product.min_stock_level && (
                    <Badge variant="destructive" className="text-xs">
                      Estoque baixo
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    product.active ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products