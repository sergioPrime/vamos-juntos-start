import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Minus, ShoppingCart, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import PDVHeader from "@/components/pdv/PDVHeader"

interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  unit_price: number
  stock_quantity: number
  category?: string
  unit: string
}

interface CartItem extends Product {
  quantity: number
  total: number
}

interface PaymentMethod {
  id: string
  name: string
  type: string
}

const PDV = () => {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // PDV Header states
  const [selectedSeller, setSelectedSeller] = useState(user?.id || "")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedTerminal, setSelectedTerminal] = useState("pdv01")
  const [selectedPriceTable, setSelectedPriceTable] = useState("")

  useEffect(() => {
    console.log('PDV useEffect - currentOrg:', currentOrg, 'orgLoading:', orgLoading)
    if (currentOrg?.id) {
      loadProducts()
      loadPaymentMethods()
    } else if (!orgLoading && !currentOrg) {
      console.log('No organization found, products loading disabled')
      setLoading(false)
    }
  }, [currentOrg, orgLoading])

  // Auto-select current user as seller
  useEffect(() => {
    if (user?.id && !selectedSeller) {
      setSelectedSeller(user.id)
    }
  }, [user, selectedSeller])

  const loadProducts = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          price_table_products!inner(
            unit_price
          )
        `)
        .eq('org_id', currentOrg?.id)
        .eq('active', true)

      // Apply price table filter if selected
      if (selectedPriceTable) {
        query = query.eq('price_table_products.price_table_id', selectedPriceTable)
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      // Map products with price table prices
      const mappedProducts = data?.map((product: any) => ({
        ...product,
        unit_price: product.price_table_products?.[0]?.unit_price || product.unit_price
      })) || []

      setProducts(mappedProducts)
      
      // Extract unique categories
      const uniqueCategories = [...new Set(mappedProducts?.map(p => p.category).filter(Boolean) as string[])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading products:', error)
      // Fallback to loading without price table
      try {
        const { data, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .eq('org_id', currentOrg?.id)
          .eq('active', true)
          .order('name')

        if (fallbackError) throw fallbackError
        setProducts(data || [])
        
        const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean) as string[])]
        setCategories(uniqueCategories)
      } catch (fallbackError) {
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentMethods = async () => {
    if (!currentOrg?.id) return
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
    }
  }

  // Debounced search for better performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm.trim() || debouncedSearchTerm.trim().length < 2) return []
    
    const search = debouncedSearchTerm.toLowerCase().trim()
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search) ||
                           product.sku?.toLowerCase().includes(search) ||
                           product.barcode?.toLowerCase().includes(search) ||
                           product.sku?.toLowerCase().startsWith(search) ||
                           product.name.toLowerCase().startsWith(search)
      
      return matchesSearch
    }).sort((a, b) => {
      // Priorizar produtos que começam com o termo buscado
      const aStartsWithSku = a.sku?.toLowerCase().startsWith(search)
      const bStartsWithSku = b.sku?.toLowerCase().startsWith(search)
      const aStartsWithName = a.name.toLowerCase().startsWith(search)
      const bStartsWithName = b.name.toLowerCase().startsWith(search)
      
      if (aStartsWithSku && !bStartsWithSku) return -1
      if (!aStartsWithSku && bStartsWithSku) return 1
      if (aStartsWithName && !bStartsWithName) return -1
      if (!aStartsWithName && bStartsWithName) return 1
      
      return a.name.localeCompare(b.name)
    })
  }, [products, debouncedSearchTerm])

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product.stock_quantity} unidades disponíveis.`,
          variant: "destructive",
        })
        return
      }
      
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.unit_price }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (product && newQuantity > product.stock_quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${product.stock_quantity} unidades disponíveis.`,
        variant: "destructive",
      })
      return
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
        : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda.",
        variant: "destructive",
      })
      return
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate order number
      const orderNumber = `PDV-${Date.now()}`
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          org_id: currentOrg?.id,
          owner_id: user?.id,
          order_number: orderNumber,
          status: 'completed',
          order_type: 'sale',
          subtotal: cartTotal,
          total_amount: cartTotal,
          payment_status: 'paid',
          payment_method: paymentMethods.find(pm => pm.id === selectedPaymentMethod)?.name,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items and update stock
      for (const item of cart) {
        // Create order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total
          })

        if (itemError) throw itemError

        // Create stock movement
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert({
            org_id: currentOrg?.id,
            product_id: item.id,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'order',
            reference_id: order.id,
            notes: `Venda PDV - ${orderNumber}`,
            created_by: user?.id
          })

        if (stockError) throw stockError
      }

      // Verificar se há caixa aberto e registrar venda
      const { data: caixaAberto } = await supabase
        .from('caixa_sessoes')
        .select('id, valor_atual')
        .eq('org_id', currentOrg?.id)
        .eq('status', 'aberto')
        .maybeSingle()

      if (caixaAberto) {
        // Atualizar valor do caixa
        await supabase
          .from('caixa_sessoes')
          .update({
            valor_atual: caixaAberto.valor_atual + cartTotal
          })
          .eq('id', caixaAberto.id)

        // Registrar movimentação do caixa
        await supabase
          .from('caixa_movimentacoes')
          .insert({
            org_id: currentOrg?.id,
            sessao_id: caixaAberto.id,
            tipo: 'venda',
            valor: cartTotal,
            descricao: `Venda PDV - ${orderNumber}`,
            reference_id: order.id,
            reference_type: 'order',
            created_by: user?.id
          })
      }

      toast({
        title: "Venda finalizada com sucesso!",
        description: `Pedido ${orderNumber} criado.`,
      })

      // Clear cart and close dialog
      clearCart()
      setIsPaymentDialogOpen(false)
      setSelectedPaymentMethod("")
      
      // Reload products to update stock
      loadProducts()

    } catch (error) {
      console.error('Error processing sale:', error)
      toast({
        title: "Erro ao processar venda",
        description: "Ocorreu um erro ao finalizar a venda. Tente novamente.",
        variant: "destructive",
      })
    }
  }

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
            Você precisa estar associado a uma organização para usar o PDV.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PDVHeader
        selectedSeller={selectedSeller}
        selectedCompany={selectedCompany}
        selectedTerminal={selectedTerminal}
        selectedPriceTable={selectedPriceTable}
        onSellerChange={setSelectedSeller}
        onCompanyChange={setSelectedCompany}
        onTerminalChange={setSelectedTerminal}
        onPriceTableChange={(value) => {
          setSelectedPriceTable(value)
          // Reload products when price table changes
          if (currentOrg?.id) {
            loadProducts()
          }
        }}
      />
      
      <div className="page-container container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar Produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length > 0) {
                    addToCart(filteredProducts[0])
                    setSearchTerm("")
                  }
                  if (e.key === 'Escape') {
                    setSearchTerm("")
                  }
                }}
              />
            </div>
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              Add. Item
            </Button>
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              Buscar Orçamento
            </Button>
          </div>

          {/* Product suggestions dropdown */}
          {searchTerm.length >= 2 && (
            <div className="absolute top-16 left-0 right-0 z-50 bg-background border rounded-md shadow-lg max-h-80 overflow-auto">
              {filteredProducts.length > 0 ? (
                <>
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Produtos encontrados ({filteredProducts.length})
                  </div>
                  {filteredProducts.slice(0, 8).map(product => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => {
                        addToCart(product)
                        setSearchTerm("")
                      }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-primary mb-1">{product.sku}</div>
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          {product.category && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Categoria: {product.category}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-green-600">
                            R$ {product.unit_price.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Estoque: {product.stock_quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length > 8 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 text-center">
                      + {filteredProducts.length - 8} produtos encontrados. Continue digitando para refinar a busca.
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="text-sm">Nenhum produto encontrado</div>
                  <div className="text-xs mt-1">Tente buscar por código ou nome do produto</div>
                </div>
              )}
            </div>
          )}

          {/* Sales Table */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <div className="bg-gray-900 text-white">
              <div className="grid grid-cols-12 gap-4 p-3 font-medium text-sm">
                <div className="col-span-6">Nome do Produto</div>
                <div className="col-span-2 text-center">Quantidade</div>
                <div className="col-span-2 text-center">Valor Un. (R$)</div>
                <div className="col-span-2 text-center">Valor Total (R$)</div>
              </div>
            </div>
            
            <div className="bg-background overflow-auto max-h-96">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                  <div>
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum produto adicionado</p>
                    <p className="text-sm">Digite o nome do produto para buscar</p>
                  </div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border-b hover:bg-accent/50">
                    <div className="col-span-6 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                      >
                        ✕
                      </Button>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.sku}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center">
                      <span className="text-sm">{item.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center">
                      <span className="text-sm font-medium">{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Search */}
          <div className="mt-4">
            <div className="relative">
              <Input
                placeholder="Buscar Cliente por Nome ou CPF/CNPJ..."
                className="bg-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-96">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4">
              <div className="pt-4 border-t">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Quantidade Total Items:</div>
                    <div className="text-2xl font-bold">{cartQuantity.toLocaleString()}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Total:</div>
                    <div className="text-3xl font-bold text-primary">
                      R$ {cartTotal.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart} className="w-full">
                      Limpar Carrinho
                    </Button>
                  )}
                  
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg" disabled={cart.length === 0}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Finalizar Venda
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Finalizar Venda</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Forma de Pagamento</label>
                          <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map(method => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>R$ {cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={processSale}
                          disabled={!selectedPaymentMethod}
                        >
                          Confirmar Venda
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  )
}

export default PDV