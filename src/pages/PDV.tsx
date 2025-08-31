import { useState, useEffect } from "react"
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

  const loadProducts = async () => {
    if (!currentOrg?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .eq('active', true)
        .order('name')

      if (error) throw error

      setProducts(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean) as string[])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      })
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos por nome, SKU ou código de barras..."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-auto">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">
                        R$ {product.unit_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Estoque: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/products')}
                >
                  Cadastrar produtos
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Carrinho ({cartQuantity})</span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    Limpar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar a venda</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-3 overflow-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.unit_price.toFixed(2)} / {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium text-sm">R$ {item.total.toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-destructive hover:text-destructive"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {cartTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PDV