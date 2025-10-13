import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Minus, ShoppingCart, CreditCard, X, Barcode, Check, Pause, TrendingDown } from "lucide-react"
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
import { CustomerSelector } from "@/components/pdv/CustomerSelector"
import { PaymentDialog } from "@/components/pdv/PaymentDialog"
import { DiscountDialog } from "@/components/pdv/DiscountDialog"
import { usePermissionGuard } from "@/hooks/usePermissionGuard"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { cn } from "@/lib/utils"

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

interface Customer {
  id: string
  name: string
  document?: string
  phone?: string
  email?: string
}

interface CartItem extends Product {
  quantity: number
  total: number
  discount: number
  discountType: 'percentage' | 'value'
}

interface SuspendedSale {
  id: string
  cart: CartItem[]
  customer: Customer | null
  total: number
  timestamp: string
}

interface PaymentMethod {
  id: string
  name: string
  type: string
}

interface PaymentSplit {
  id: string
  paymentMethodId: string
  amount: number
}

const PDV = () => {
  usePermissionGuard('vendas', 'read')
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
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [barcodeBuffer, setBarcodeBuffer] = useState("")
  const [lastKeyTime, setLastKeyTime] = useState(0)
  
  // New features states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'value'>('percentage')
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [isItemDiscountDialogOpen, setIsItemDiscountDialogOpen] = useState(false)
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null)
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([])
  const [showSuspendedSales, setShowSuspendedSales] = useState(false)
  
  // PDV Header states
  const [selectedSeller, setSelectedSeller] = useState(user?.id || "")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedTerminal, setSelectedTerminal] = useState("pdv01")
  const [selectedPriceTable, setSelectedPriceTable] = useState("")
  
  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    }).slice(0, 20) // Limit to 20 items
  }, [products, debouncedSearchTerm])

  const addToCart = (product: Product) => {
    // Verificar se o produto tem estoque disponível
    if (product.stock_quantity <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: `Não foi possível inserir o produto "${product.name}" pois está com estoque insuficiente.`,
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Não foi possível adicionar mais unidades. Apenas ${product.stock_quantity} unidades disponíveis.`,
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
      setCart([...cart, { ...product, quantity: 1, total: product.unit_price, discount: 0, discountType: 'percentage' }])
    }
    
    // Visual feedback
    setAddingToCart(product.id)
    setTimeout(() => setAddingToCart(null), 500)
    
    toast({
      title: "✓ Produto adicionado",
      description: product.name,
      duration: 2000,
    })
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
    setSelectedCustomer(null)
    setGlobalDiscount(0)
  }

  // Calculate totals with discounts
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const cartItemsDiscount = cart.reduce((sum, item) => {
    const itemDiscount = item.discountType === 'percentage'
      ? (item.quantity * item.unit_price * item.discount) / 100
      : item.discount
    return sum + itemDiscount
  }, 0)
  const subtotalBeforeDiscounts = cartSubtotal
  const globalDiscountAmount = globalDiscountType === 'percentage'
    ? (cartSubtotal - cartItemsDiscount) * globalDiscount / 100
    : globalDiscount
  const cartTotal = cartSubtotal - cartItemsDiscount - globalDiscountAmount
  const finalTotal = cartTotal
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Suspended sales management
  const suspendSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Não há itens para suspender.",
        variant: "destructive",
      })
      return
    }

    const suspended: SuspendedSale = {
      id: Date.now().toString(),
      cart: [...cart],
      customer: selectedCustomer,
      total: cartTotal,
      timestamp: new Date().toISOString()
    }

    setSuspendedSales([...suspendedSales, suspended])
    clearCart()
    
    toast({
      title: "Venda suspensa",
      description: "A venda foi salva e pode ser recuperada depois.",
    })
  }

  const recoverSale = (sale: SuspendedSale) => {
    setCart(sale.cart)
    setSelectedCustomer(sale.customer)
    setSuspendedSales(suspendedSales.filter(s => s.id !== sale.id))
    setShowSuspendedSales(false)
    
    toast({
      title: "Venda recuperada",
      description: "A venda foi restaurada no carrinho.",
    })
  }

  const applyItemDiscount = (discountValue: number, isPercentage: boolean) => {
    if (!selectedItemForDiscount) return

    setCart(cart.map(item =>
      item.id === selectedItemForDiscount
        ? { 
            ...item, 
            discount: discountValue,
            discountType: isPercentage ? 'percentage' : 'value'
          }
        : item
    ))

    toast({
      title: "Desconto aplicado",
      description: "O desconto foi aplicado ao item.",
    })
  }

  const applyGlobalDiscount = (discountValue: number, isPercentage: boolean) => {
    setGlobalDiscount(discountValue)
    setGlobalDiscountType(isPercentage ? 'percentage' : 'value')

    toast({
      title: "Desconto geral aplicado",
      description: "O desconto foi aplicado ao total da venda.",
    })
  }

  // Barcode scanner detection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime()
      
      // Detect rapid typing (barcode scanner)
      if (currentTime - lastKeyTime < 50) {
        if (e.key === 'Enter') {
          // Barcode complete
          if (barcodeBuffer.length > 5) {
            const product = products.find(p => 
              p.barcode === barcodeBuffer || 
              p.sku === barcodeBuffer
            )
            if (product) {
              addToCart(product)
              setSearchTerm("")
            } else {
              toast({
                title: "Produto não encontrado",
                description: `Código: ${barcodeBuffer}`,
                variant: "destructive",
              })
            }
          }
          setBarcodeBuffer("")
        } else if (e.key.length === 1) {
          setBarcodeBuffer(prev => prev + e.key)
        }
      } else {
        // Normal typing - reset buffer
        setBarcodeBuffer(e.key.length === 1 ? e.key : "")
      }
      
      setLastKeyTime(currentTime)
    }
    
    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [barcodeBuffer, lastKeyTime, products])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'f1',
      action: () => searchInputRef.current?.focus(),
      description: 'Consultar Produtos'
    },
    {
      key: 'f2',
      action: () => {
        setSearchTerm("")
        searchInputRef.current?.focus()
      },
      description: 'Nova Busca'
    },
    {
      key: 'f5',
      action: () => {
        if (cart.length > 0) {
          setIsDiscountDialogOpen(true)
        }
      },
      description: 'Desconto Geral'
    },
    {
      key: 'f8',
      action: () => {
        if (cart.length > 0) {
          setIsPaymentDialogOpen(true)
        }
      },
      description: 'Finalizar Venda'
    },
    {
      key: 'f9',
      action: () => suspendSale(),
      description: 'Suspender Venda'
    },
    {
      key: 'f12',
      action: () => setShowSuspendedSales(!showSuspendedSales),
      description: 'Vendas Suspensas'
    },
    {
      key: 'escape',
      action: () => {
        setSearchTerm("")
        setIsPaymentDialogOpen(false)
        setIsDiscountDialogOpen(false)
      },
      description: 'Cancelar/Limpar',
      preventDefault: false
    }
  ])

  const processSale = async (payments: PaymentSplit[], receivedAmount: number) => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda.",
        variant: "destructive",
      })
      return
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se há caixa aberto antes de processar venda
    const { data: caixaAberto, error: caixaError } = await supabase
      .from('caixa_sessoes')
      .select('id, valor_atual')
      .eq('org_id', currentOrg?.id)
      .eq('status', 'aberto')
      .maybeSingle()

    if (caixaError) {
      toast({
        title: "Erro ao verificar caixa",
        description: "Não foi possível verificar o status do caixa.",
        variant: "destructive",
      })
      return
    }

    if (!caixaAberto) {
      toast({
        title: "Caixa fechado",
        description: "Não é possível realizar vendas com o caixa fechado. Abra o caixa primeiro em 'Operações PDV'.",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate order number
      const orderNumber = `PDV-${Date.now()}`
      
      // Create payment methods string
      const paymentMethodsStr = payments
        .map(p => {
          const method = paymentMethods.find(pm => pm.id === p.paymentMethodId)
          return `${method?.name}: ${p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        })
        .join(', ')

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          org_id: currentOrg?.id,
          owner_id: user?.id,
          order_number: orderNumber,
          status: 'completed',
          order_type: 'sale',
          subtotal: subtotalBeforeDiscounts,
          total_amount: finalTotal,
          payment_status: 'paid',
          payment_method: paymentMethodsStr,
          completed_at: new Date().toISOString(),
          customer_id: selectedCustomer?.id
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

      // Registrar venda no caixa (já verificado que está aberto)
      // Atualizar valor do caixa
      await supabase
        .from('caixa_sessoes')
        .update({
          valor_atual: caixaAberto.valor_atual + finalTotal
        })
        .eq('id', caixaAberto.id)

      // Registrar movimentação do caixa
      await supabase
        .from('caixa_movimentacoes')
        .insert({
          org_id: currentOrg?.id,
          sessao_id: caixaAberto.id,
          tipo: 'venda',
          valor: finalTotal,
          descricao: `Venda PDV - ${orderNumber}`,
          reference_id: order.id,
          reference_type: 'order',
          created_by: user?.id
        })

      // Criar lançamento financeiro (receita já liquidada)
      // Se não houver cliente selecionado, buscar ou criar um cliente "CONSUMIDOR"
      let customerId = selectedCustomer?.id
      
      if (!customerId) {
        // Buscar cliente padrão "CONSUMIDOR"
        const { data: consumidorCliente, error: consumidorError } = await supabase
          .from('customers')
          .select('id')
          .eq('org_id', currentOrg?.id)
          .eq('name', 'CONSUMIDOR')
          .maybeSingle()

        if (consumidorCliente) {
          customerId = consumidorCliente.id
        } else {
          // Criar cliente "CONSUMIDOR" se não existir
          const { data: novoConsumidor, error: createConsumidorError } = await supabase
            .from('customers')
            .insert({
              org_id: currentOrg?.id,
              name: 'CONSUMIDOR',
              owner_id: user?.id
            })
            .select('id')
            .single()

          if (!createConsumidorError && novoConsumidor) {
            customerId = novoConsumidor.id
          }
        }
      }

      // Criar lançamento financeiro
      if (customerId) {
        // Obter o primeiro método de pagamento usado
        const firstPaymentMethodId = payments[0]?.paymentMethodId

        const { error: financialError } = await supabase
          .from('financial_entries')
          .insert({
            org_id: currentOrg?.id,
            person_id: customerId,
            person_type: 'customer',
            entry_type: 'receivable',
            amount: finalTotal,
            description: `Venda PDV - ${orderNumber}`,
            due_date: new Date().toISOString().split('T')[0],
            competence_date: new Date().toISOString().split('T')[0],
            is_settled: true,
            settled_at: new Date().toISOString(),
            payment_method_id: firstPaymentMethodId,
            settled_payment_method_id: firstPaymentMethodId,
            origin_type: 'order',
            origin_id: order.id,
            created_by: user?.id
          })

        if (financialError) {
          console.error('Error creating financial entry:', financialError)
          // Não interrompe o fluxo se houver erro no lançamento financeiro
        }
      }

      toast({
        title: "Venda finalizada com sucesso!",
        description: `Pedido ${orderNumber} criado e lançamento financeiro registrado.`,
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
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Barcode className="absolute right-3 top-3 h-5 w-5 text-primary animate-pulse" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar produto ou passe o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
                autoFocus
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
          </div>

          {/* Product suggestions dropdown */}
          {searchTerm.length >= 2 && (
            <div className="absolute top-14 left-0 right-0 z-50 bg-background border-2 border-primary/20 rounded-lg shadow-2xl max-h-96 overflow-auto animate-fade-in">
              {filteredProducts.length > 0 ? (
                <>
                   <div className="bg-primary/5 sticky top-0 px-4 py-3 text-sm font-semibold text-foreground border-b flex items-center justify-between">
                     <span>Produtos encontrados</span>
                     <Badge variant="secondary">{Math.min(filteredProducts.length, 20)}</Badge>
                   </div>
                   {filteredProducts.map((product, index) => (
                     <div
                       key={product.id}
                       className={cn(
                         "p-4 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 transition-all duration-200",
                         addingToCart === product.id && "bg-green-100 dark:bg-green-900/20 scale-[0.98]",
                         index === 0 && "bg-accent/50"
                       )}
                       onClick={() => {
                         addToCart(product)
                         setSearchTerm("")
                       }}
                     >
                       <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-xs font-mono">
                                 {product.sku || product.barcode || 'N/A'}
                               </Badge>
                               {index === 0 && (
                                 <Badge className="text-xs bg-primary">Enter para adicionar</Badge>
                               )}
                             </div>
                             <span className="text-sm font-semibold truncate">
                               {product.name}
                             </span>
                           </div>
                         </div>
                         <div className="flex items-center gap-4">
                           <div className="text-right">
                             <div className="text-lg font-bold text-primary">
                               R$ {product.unit_price.toFixed(2)}
                             </div>
                             <div className="text-xs text-muted-foreground">
                               Estoque: {product.stock_quantity} {product.unit}
                             </div>
                           </div>
                           <Plus className="h-5 w-5 text-primary" />
                         </div>
                       </div>
                     </div>
                   ))}
                </>
              ) : (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <div className="text-sm font-medium text-muted-foreground">Nenhum produto encontrado</div>
                  <div className="text-xs text-muted-foreground mt-1">Tente buscar por código, nome ou código de barras</div>
                </div>
              )}
            </div>
          )}

          {/* Sales Table */}
          <div className="flex-1 border-2 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-sm">
                <div className="col-span-6">Produto</div>
                <div className="col-span-2 text-center">Quantidade</div>
                <div className="col-span-2 text-center">Valor Un.</div>
                <div className="col-span-2 text-center">Total</div>
              </div>
            </div>
            
            <div className="bg-background overflow-auto max-h-[400px]">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-12 text-center">
                  <div className="animate-fade-in">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-lg font-medium text-muted-foreground">Carrinho vazio</p>
                    <p className="text-sm text-muted-foreground/60 mt-2">
                      Busque produtos ou passe o código de barras
                    </p>
                  </div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-accent/50 transition-all duration-200 animate-fade-in group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {item.sku || item.barcode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-base">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center">
                      <span className="text-sm font-medium">R$ {item.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center">
                      <span className="text-base font-bold text-primary">R$ {item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Search */}
          <div className="mt-4">
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
            />
          </div>
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-96">
          <Card className="h-full flex flex-col border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
              <CardTitle className="text-center text-xl">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6 space-y-6">
              {/* Items Count */}
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Itens no Carrinho</div>
                <div className="text-4xl font-bold text-foreground">{cartQuantity}</div>
              </div>
              
              {/* Detailed Totals */}
              <div className="space-y-3 p-4 bg-accent/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R$ {cartSubtotal.toFixed(2)}</span>
                </div>
                {cartItemsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desc. Itens:</span>
                    <span className="font-medium text-orange-600">- R$ {cartItemsDiscount.toFixed(2)}</span>
                  </div>
                )}
                {globalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desc. Geral:</span>
                    <span className="font-medium text-orange-600">- R$ {globalDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Total Amount */}
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
                <div className="text-sm font-semibold text-muted-foreground mb-2">TOTAL A PAGAR</div>
                <div className="text-5xl font-bold text-primary animate-scale-in">
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3 mt-auto">
                {cart.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsDiscountDialogOpen(true)}
                        className="gap-2"
                      >
                        <TrendingDown className="h-4 w-4" />
                        Desconto (F5)
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={suspendSale}
                        className="gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        Suspender (F9)
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearCart} 
                      className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar Carrinho
                    </Button>
                  </>
                )}
                
                <Button 
                  className="w-full h-14 text-lg font-semibold relative z-50" 
                  size="lg" 
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Finalizar Venda (F8)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialogs */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        totalAmount={cartTotal}
        paymentMethods={paymentMethods}
        onConfirm={(payments, receivedAmount) => {
          processSale(payments, receivedAmount)
        }}
      />

      <DiscountDialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
        currentValue={cartSubtotal - cartItemsDiscount}
        onApply={applyGlobalDiscount}
        title="Desconto Geral"
      />

      <DiscountDialog
        open={isItemDiscountDialogOpen}
        onOpenChange={setIsItemDiscountDialogOpen}
        currentValue={
          selectedItemForDiscount 
            ? (cart.find(i => i.id === selectedItemForDiscount)?.quantity || 0) * 
              (cart.find(i => i.id === selectedItemForDiscount)?.unit_price || 0)
            : 0
        }
        onApply={applyItemDiscount}
        title="Desconto no Item"
      />

      {/* Keyboard Shortcuts Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-muted/80 backdrop-blur-sm border-t border-border z-40">
        <div className="container mx-auto px-6 py-3">
          <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F1</kbd>
              <span>Produtos</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F2</kbd>
              <span>Nova Busca</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F3</kbd>
              <span>Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F5</kbd>
              <span>Desconto</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F8</kbd>
              <span>Finalizar</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F9</kbd>
              <span>Suspender</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono font-semibold">F12</kbd>
              <span>Vendas Suspensas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default PDV