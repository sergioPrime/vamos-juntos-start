import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Minus, ShoppingCart, CreditCard, X, Barcode, Check, Pause, TrendingDown, FileText, User, MessageSquare, Clock } from "lucide-react"
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
import { AbrirCaixaDialog } from "@/components/pdv/AbrirCaixaDialog"
import { CaixaClosedScreen } from "@/components/pdv/CaixaClosedScreen"
import { QuickProductDialog } from "@/components/pdv/QuickProductDialog"
import { usePermissionCheck } from "@/hooks/usePermissionCheck"
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
  usePermissionCheck('vendas', 'read')
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
  
  // Cash register states
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null)
  const [isAbrirCaixaDialogOpen, setIsAbrirCaixaDialogOpen] = useState(false)
  const [loadingCaixa, setLoadingCaixa] = useState(true)
  
  // New features states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
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
  
  // Quick product dialog
  const [isQuickProductDialogOpen, setIsQuickProductDialogOpen] = useState(false)
  const [quickProductInitialName, setQuickProductInitialName] = useState("")

  // Check if cash register is open
  useEffect(() => {
    const checkCaixaStatus = async () => {
      if (!currentOrg?.id || !user?.id) return
      
      setLoadingCaixa(true)
      try {
        const { data, error } = await supabase
          .from('caixa_sessoes')
          .select('id, status')
          .eq('org_id', currentOrg.id)
          .eq('usuario_abertura', user.id)
          .eq('status', 'aberto')
          .order('abertura_em', { ascending: false })
          .limit(1)

        if (error) throw error
        
        setCaixaAberto(data && data.length > 0)
      } catch (error) {
        console.error('Error checking cash register status:', error)
        setCaixaAberto(false)
      } finally {
        setLoadingCaixa(false)
      }
    }

    checkCaixaStatus()
  }, [currentOrg, user])

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
          price_table_products(
            sale_price,
            price_table_id
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
        unit_price: product.price_table_products?.[0]?.sale_price || product.unit_price
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

    setCart(cart.map(item => {
      if (item.id === selectedItemForDiscount) {
        const itemSubtotal = item.quantity * item.unit_price
        let itemDiscount = 0
        
        if (isPercentage) {
          itemDiscount = itemSubtotal * (discountValue / 100)
        } else {
          itemDiscount = discountValue
        }
        
        return {
          ...item,
          discount: discountValue,
          discountType: isPercentage ? 'percentage' : 'value',
          total: itemSubtotal - itemDiscount
        }
      }
      return item
    }))

    toast({
      title: "Desconto aplicado",
      description: "O desconto foi aplicado ao item.",
    })
    
    setIsItemDiscountDialogOpen(false)
    setSelectedItemForDiscount(null)
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
        setIsCustomerDialogOpen(true)
      },
      description: 'Cliente'
    },
    {
      key: 'f5',
      action: () => {
        if (cart.length > 0) {
          setIsDiscountDialogOpen(true)
        }
      },
      description: 'Desconto'
    },
    {
      key: 'f6',
      action: () => {
        clearCart()
      },
      description: 'Cancelar'
    },
    {
      key: 'f7',
      action: () => {
        suspendSale()
      },
      description: 'Aguardar'
    },
    {
      key: 'f8',
      action: () => {
        if (cart.length > 0) {
          processQuickCashSale()
        }
      },
      description: 'Finalizar Rápido'
    },
    {
      key: 'f9',
      action: () => {
        // TODO: Abrir relatório de vendas
        console.log('Relatório de vendas')
      },
      description: 'Relatório de Vendas'
    },
    {
      key: 'f10',
      action: () => {
        // TODO: Abrir observações
        console.log('Observações')
      },
      description: 'Observações'
    },
    {
      key: 'f11',
      action: () => {
        setShowSuspendedSales(true)
      },
      description: 'Aguardando'
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

  // Quick cash sale function
  const processQuickCashSale = async () => {
    if (cart.length === 0) return

    // Find cash payment method
    const cashPaymentMethod = paymentMethods.find(pm => 
      pm.name.toLowerCase().includes('dinheiro') || 
      pm.type.toLowerCase().includes('cash')
    )

    if (!cashPaymentMethod) {
      toast({
        title: "Forma de pagamento não encontrada",
        description: "Não foi possível encontrar o método de pagamento 'Dinheiro'. Configure-o antes de usar esta opção.",
        variant: "destructive",
      })
      return
    }

    // Create payment split for cash
    const cashPayment: PaymentSplit = {
      id: Date.now().toString(),
      paymentMethodId: cashPaymentMethod.id,
      amount: finalTotal
    }

    await processSale([cashPayment], finalTotal)
  }

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
      console.log('[PDV] Iniciando processo de venda...')
      
      // Create payment methods string
      const paymentMethodsStr = payments
        .map(p => {
          const method = paymentMethods.find(pm => pm.id === p.paymentMethodId)
          return `${method?.name}: ${p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        })
        .join(', ')

      console.log('[PDV] Criando pedido...', {
        org_id: currentOrg?.id,
        customer_id: selectedCustomer?.id,
        total_amount: finalTotal
      })

      // Create order (order_number será gerado automaticamente pelo trigger)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          org_id: currentOrg?.id,
          owner_id: user?.id,
          order_number: '', // Será gerado automaticamente pelo trigger set_order_number
          status: 'completed',
          order_type: 'sale',
          subtotal: subtotalBeforeDiscounts,
          total_amount: finalTotal,
          payment_status: 'paid',
          payment_method: paymentMethodsStr,
          completed_at: new Date().toISOString(),
          customer_id: selectedCustomer?.id
        }])
        .select()
      
      if (orderError) {
        console.error('[PDV] Erro ao criar pedido:', orderError)
        throw orderError
      }
      
      console.log('[PDV] Pedido criado com sucesso:', orderData[0])
      const order = orderData[0]

      console.log('[PDV] Criando itens do pedido...')
      
      // Create order items and stock movements (triggers will validate and sync automatically)
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

        // Create stock movement - triggers will validate stock and sync quantities
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert({
            org_id: currentOrg?.id,
            product_id: item.id,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'order',
            reference_id: order.id,
            notes: `Venda PDV - ${order.order_number}`,
            created_by: user?.id
          })

        // Check if stock validation failed
        if (stockError) {
          // If stock validation error, show specific message
          if (stockError.message?.includes('Estoque insuficiente')) {
            toast({
              title: "Estoque insuficiente",
              description: stockError.message,
              variant: "destructive",
            })
          }
          throw stockError
        }
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
          descricao: `Venda PDV - ${order.order_number}`,
          reference_id: order.id,
          reference_type: 'order',
          created_by: user?.id
        })

      console.log('[PDV] Movimentações de caixa registradas com sucesso')
      
      // Criar lançamento financeiro (receita já liquidada)
      // Se não houver cliente selecionado, buscar ou criar um cliente "CONSUMIDOR"
      let customerId = selectedCustomer?.id
      
      console.log('[PDV] Preparando lançamento financeiro para cliente:', customerId || 'CONSUMIDOR')
      
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
        console.log('[PDV] Criando lançamento financeiro...')
        
        // Obter o primeiro método de pagamento usado
        const firstPaymentMethodId = payments[0]?.paymentMethodId

        // Calcular data de vencimento baseado no método de pagamento
        const firstPaymentMethod = paymentMethods.find(pm => pm.id === firstPaymentMethodId)
        const paymentMethodName = firstPaymentMethod?.name?.toLowerCase() || ''
        
        let dueDate = new Date()
        if (paymentMethodName.includes('débito')) {
          // Cartão de débito: vencimento D+1
          dueDate.setDate(dueDate.getDate() + 1)
        } else if (paymentMethodName.includes('crédito')) {
          // Cartão de crédito: vencimento D+30
          dueDate.setDate(dueDate.getDate() + 30)
        }
        // Para outros métodos (Dinheiro, PIX, etc): data atual

        const { error: financialError } = await supabase
          .from('financial_entries')
          .insert({
            org_id: currentOrg?.id,
            person_id: customerId,
            person_type: 'customer',
            entry_type: 'receivable',
            amount: finalTotal,
            description: `Venda PDV - ${order.order_number}`,
            due_date: dueDate.toISOString().split('T')[0],
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
          console.error('[PDV] Erro ao criar lançamento financeiro:', financialError)
          // Não interrompe o fluxo se houver erro no lançamento financeiro
        } else {
          console.log('[PDV] Lançamento financeiro criado com sucesso')
        }
      } else {
        console.warn('[PDV] Nenhum cliente encontrado, lançamento financeiro não criado')
      }

      console.log('[PDV] Venda finalizada com sucesso!')
      
      toast({
        title: "Venda finalizada com sucesso!",
        description: `Pedido ${order.order_number} criado e lançamento financeiro registrado.`,
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
  if (orgLoading || loading || loadingCaixa) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
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

  // Show cash register closed screen if not open
  if (caixaAberto === false) {
    return (
      <>
        <PDVHeader
          selectedSeller={selectedSeller}
          selectedCompany={selectedCompany}
          selectedTerminal={selectedTerminal}
          selectedPriceTable={selectedPriceTable}
          onSellerChange={setSelectedSeller}
          onCompanyChange={setSelectedCompany}
          onTerminalChange={setSelectedTerminal}
          onPriceTableChange={setSelectedPriceTable}
        />
        
        <CaixaClosedScreen 
          onOpenCaixa={() => setIsAbrirCaixaDialogOpen(true)} 
        />

        <AbrirCaixaDialog
          open={isAbrirCaixaDialogOpen}
          onOpenChange={setIsAbrirCaixaDialogOpen}
          onSuccess={() => setCaixaAberto(true)}
        />
        
        <QuickProductDialog
          open={isQuickProductDialogOpen}
          onOpenChange={setIsQuickProductDialogOpen}
          initialName={quickProductInitialName}
          onSuccess={() => {
            loadProducts()
            setSearchTerm("")
          }}
        />
      </>
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
              <div className="bg-primary/5 sticky top-0 px-4 py-3 text-sm font-semibold text-foreground border-b flex items-center justify-between">
                <span>Produtos encontrados</span>
                <Badge variant="secondary">{filteredProducts.length > 0 ? Math.min(filteredProducts.length, 20) : 0}</Badge>
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
              
              {filteredProducts.length === 0 && (
                <div 
                  className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 cursor-pointer transition-all border-b"
                  onClick={() => {
                    setQuickProductInitialName(searchTerm)
                    setIsQuickProductDialogOpen(true)
                  }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-green-700 dark:text-green-400">Cadastrar Novo Produto</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Clique para cadastrar "{searchTerm}"</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Table - Compact */}
          <div className="border-2 rounded-xl overflow-hidden shadow-lg" style={{ height: '450px', marginBottom: '1rem' }}>
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-xs">
                <div className="col-span-1 text-center">Item</div>
                <div className="col-span-5">Produto</div>
                <div className="col-span-6 text-right">Total</div>
              </div>
            </div>
            
            <div className="bg-background overflow-auto" style={{ height: 'calc(450px - 45px)' }}>
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center p-4">
                  <div className="animate-fade-in">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground italic">Não há nenhum produto vendido.</p>
                  </div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-12 gap-2 py-1 px-2 border-b hover:bg-accent/50 transition-all duration-200 animate-fade-in group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="col-span-1 flex items-center justify-center relative">
                      <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="absolute text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="col-span-5 flex items-center min-w-0">
                      <div className="font-medium text-xs truncate">{item.name}</div>
                    </div>
                    <div className="col-span-6 flex items-center justify-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-bold text-primary min-w-[70px] text-right">R$ {item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons Grid - 2 rows x 3 columns */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={suspendSale}
              disabled={cart.length === 0}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Pause className="h-4 w-4" />
              <span className="text-xs font-semibold">Aguardar (F7)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCart}
              disabled={cart.length === 0}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <X className="h-4 w-4" />
              <span className="text-xs font-semibold">Cancelar (F6)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={processQuickCashSale}
              disabled={cart.length === 0}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-semibold">Finalizar Rápido (F8)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSuspendedSales(true)}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">Aguardando (F11)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCustomerDialogOpen(true)}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <User className="h-4 w-4" />
              <span className="text-xs font-semibold">Cliente (F2)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // TODO: Abrir observações
              }}
              className="gap-1 h-12 flex-col bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-semibold">Observações (F10)</span>
            </Button>
          </div>

          {/* Selected Customer Display */}
          {selectedCustomer && (
            <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Cliente Selecionado:</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{selectedCustomer.name}</div>
                  {selectedCustomer.document && (
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedCustomer.document}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-96">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-4 space-y-3">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-2 bg-accent/30 rounded">
                  <span className="text-muted-foreground">Total de itens:</span>
                  <span className="font-bold">{cartQuantity}</span>
                </div>
                <div className="flex justify-between p-2 bg-accent/30 rounded">
                  <span className="text-muted-foreground">Itens cancelados:</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between p-2 bg-accent/30 rounded">
                  <span className="text-muted-foreground">Total de desconto:</span>
                  <span className="font-bold text-orange-600">R$ {(cartItemsDiscount + globalDiscountAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 bg-accent/30 rounded">
                  <span className="text-muted-foreground">Total de acréscimo:</span>
                  <span className="font-bold">R$ 0,00</span>
                </div>
              </div>

              <Separator />

              {/* Discount Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDiscountDialogOpen(true)}
                disabled={cart.length === 0}
                className="w-full gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                Aplicar Desconto (F5)
              </Button>

              <Separator />
              
              {/* Total Amount */}
              <div className="text-center py-4 bg-accent/20 rounded-lg">
                <div className="text-6xl font-bold text-destructive">
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </div>
              </div>
              
              {/* Finalize Button */}
              <Button 
                className="w-full h-16 text-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                size="lg" 
                disabled={cart.length === 0}
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                Finalizar (F5)
              </Button>
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

      <QuickProductDialog
        open={isQuickProductDialogOpen}
        onOpenChange={setIsQuickProductDialogOpen}
        initialName={quickProductInitialName}
        onSuccess={() => {
          loadProducts()
          setSearchTerm("")
        }}
      />

      {/* Customer Selection Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Selecionar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerChange={(customer) => {
                setSelectedCustomer(customer)
                if (customer) {
                  setIsCustomerDialogOpen(false)
                  toast({
                    title: "Cliente selecionado",
                    description: customer.name,
                  })
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </div>
  )
}

export default PDV