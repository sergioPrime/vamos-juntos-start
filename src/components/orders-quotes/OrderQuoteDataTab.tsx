import { useState, useEffect } from "react"
import { Plus, Minus, Search, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"

interface SalesCategory {
  id: string
  name: string
  moves_stock: boolean
  moves_financial: boolean
  visible_in_fiscal_operations: boolean
}

interface PriceTable {
  id: string
  name: string
  gender: string
  visible_in_pdv: boolean
}

interface OrderQuoteFormData {
  id?: string
  number: string
  type: 'order' | 'quote'
  status: string
  customer_id?: string
  company_id?: string
  sales_origin: string
  category: string
  price_table: string
  warehouse: string
  seller: string
  system_status: string
  total_amount: number
  notes?: string
  items: OrderQuoteItem[]
  generate_service_order: boolean
}

interface OrderQuoteItem {
  id?: string
  product_id?: string
  service_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  auto_purchase: boolean
  item_type: 'product' | 'service'
}

interface OrderQuoteDataTabProps {
  formData: OrderQuoteFormData
  onUpdateFormData: (updates: Partial<OrderQuoteFormData>) => void
  onCalculateTotal: () => void
}

interface Customer {
  id: string
  name: string
}

interface Company {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  unit_price: number
  genre?: string
}

export function OrderQuoteDataTab({ formData, onUpdateFormData, onCalculateTotal }: OrderQuoteDataTabProps) {
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([])
  const [priceTables, setPriceTables] = useState<PriceTable[]>([])
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchProduct, setSearchProduct] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  useEffect(() => {
    if (currentOrg?.id) {
      loadCustomers()
      loadCompanies()
      loadProducts()
      loadSalesCategories()
      loadPriceTables()
    }
  }, [currentOrg])

  useEffect(() => {
    onCalculateTotal()
  }, [formData.items])

  const loadCustomers = async () => {
    try {
      // Mock data for now
      setCustomers([
        { id: '1', name: 'Cliente Exemplo 1' },
        { id: '2', name: 'Cliente Exemplo 2' }
      ])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, is_default')
        .eq('org_id', currentOrg?.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      
      // Auto-select the default company if no company is currently selected
      if (data && data.length > 0 && !formData.company_id) {
        const defaultCompany = data.find(company => company.is_default)
        if (defaultCompany) {
          onUpdateFormData({ company_id: defaultCompany.id })
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadProducts = async () => {
    try {
      // Mock data for now
      setProducts([
        { id: '1', name: 'Produto Exemplo 1', unit_price: 100.00 },
        { id: '2', name: 'Serviço Exemplo 1', unit_price: 200.00 }
      ])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadSalesCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_categories')
        .select('id, name, moves_stock, moves_financial, visible_in_fiscal_operations')
        .eq('org_id', currentOrg?.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setSalesCategories(data || [])
    } catch (error) {
      console.error('Error loading sales categories:', error)
    }
  }

  const loadPriceTables = async () => {
    try {
      const { data, error } = await supabase
        .from('price_tables')
        .select('id, name, gender, visible_in_pdv')
        .eq('org_id', currentOrg?.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPriceTables(data || [])
    } catch (error) {
      console.error('Error loading price tables:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const addItem = () => {
    if (!selectedProduct || newItemQuantity <= 0) {
      toast({
        title: "Erro de validação",
        description: "Selecione um produto e quantidade válida.",
        variant: "destructive",
      })
      return
    }

    const itemType = 'product' // Default to product for now
    const totalPrice = selectedProduct.unit_price * newItemQuantity

    const newItem: OrderQuoteItem = {
      id: `temp-${Date.now()}`,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: newItemQuantity,
      unit_price: selectedProduct.unit_price,
      total_price: totalPrice,
      auto_purchase: itemType === 'product' ? false : false, // Services can't have auto purchase
      item_type: itemType
    }

    onUpdateFormData({
      items: [...formData.items, newItem]
    })

    // Reset form
    setSelectedProduct(null)
    setSearchProduct("")
    setNewItemQuantity(1)
  }

  const updateItem = (index: number, field: keyof OrderQuoteItem, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total price when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    onUpdateFormData({ items: updatedItems })
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    onUpdateFormData({ items: updatedItems })
  }

  const toggleAutoPurchase = (index: number, enabled: boolean) => {
    const item = formData.items[index]
    
    // Services cannot have auto purchase
    if (item.item_type === 'service' && enabled) {
      toast({
        title: "Aviso",
        description: "Serviços não podem gerar ordens de compra automaticamente.",
        variant: "destructive",
      })
      return
    }
    
    updateItem(index, 'auto_purchase', enabled)
  }

  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente/Fornecedor</Label>
            <Select value={formData.customer_id} onValueChange={(value) => onUpdateFormData({ customer_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select value={formData.company_id} onValueChange={(value) => onUpdateFormData({ company_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_origin">Origem da Venda</Label>
            <Select value={formData.sales_origin} onValueChange={(value) => onUpdateFormData({ sales_origin: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Site</SelectItem>
                <SelectItem value="store">Loja Física</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="social">Redes Sociais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => onUpdateFormData({ category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
               <SelectContent>
                {salesCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_table">Tabela de Preços</Label>
            <Select value={formData.price_table} onValueChange={(value) => onUpdateFormData({ price_table: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a tabela" />
              </SelectTrigger>
              <SelectContent>
                {priceTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">Depósito</Label>
            <Select value={formData.warehouse} onValueChange={(value) => onUpdateFormData({ warehouse: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Principal</SelectItem>
                <SelectItem value="secondary">Secundário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seller">Vendedor</Label>
            <Input
              id="seller"
              value={formData.seller}
              onChange={(e) => onUpdateFormData({ seller: e.target.value })}
              placeholder="Nome do vendedor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.number}
              onChange={(e) => onUpdateFormData({ number: e.target.value })}
              placeholder="Código do pedido/orçamento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_status">Status do Sistema</Label>
            <Select value={formData.system_status} onValueChange={(value) => onUpdateFormData({ system_status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido/Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Item Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Produto/Serviço</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchProduct && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.slice(0, 5).map(product => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product)
                        setSearchProduct(product.name)
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        R$ {product.unit_price.toFixed(2)} - Produto
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                placeholder="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Preço Unitário</Label>
              <Input
                value={selectedProduct ? `R$ ${selectedProduct.unit_price.toFixed(2)}` : "R$ 0,00"}
                disabled
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={addItem} disabled={!selectedProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Items Table */}
          {formData.items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Auto Compra</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead className="w-24">Quantidade</TableHead>
                  <TableHead className="w-32">Preço Unit.</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      <div className="flex justify-center">
                        <Switch
                          checked={item.auto_purchase}
                          onCheckedChange={(checked) => toggleAutoPurchase(index, checked)}
                          disabled={item.item_type === 'service'}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        {item.auto_purchase && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Gera Compra
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.item_type === 'product' ? 'default' : 'secondary'}>
                        {item.item_type === 'product' ? 'Produto' : 'Serviço'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Total */}
          {formData.items.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <div className="text-lg font-bold">
                  Total: R$ {formData.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}