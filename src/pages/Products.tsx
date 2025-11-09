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
import { useMask } from "@/hooks/useMask"
import { usePermissionGuard } from "@/hooks/usePermissionGuard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CompetitorPriceScraper } from "@/components/products/CompetitorPriceScraper"
import { NCMSearchDialog } from "@/components/products/NCMSearchDialog"
import { useTaxGroups } from "@/hooks/useTaxGroups"

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
  // Campos de precificação
  operational_expenses?: number
  cost_with_additions?: number
  representation_commission?: number
  freight_on_purchase?: number
  insurance_on_purchase?: number
  minimum_sale_price?: number
  seller_commission_amount?: number
  seller_commission_percent?: number
  ipi_on_purchase?: number
  icms_on_purchase?: number
  mva_profit_amount?: number
  mva_profit_percent?: number
  assembly_fee_amount?: number
  assembly_fee_percent?: number
  icms_st_on_purchase?: number
  fcp_st_on_purchase?: number
  last_purchase_value?: number
  cost_calculation_method?: string
  // Análise de concorrência
  competitor_prices?: { name: string; price: number; url?: string }[]
  market_price_min?: number
  market_price_max?: number
  last_market_check?: string
  // Campos fiscais
  tax_group_id?: string
  grupo_tributario?: string
  cfop_padrao?: string
  codigo_ncm?: string
  codigo_cest?: string
  ean_codigo_barras?: string
  unidade_comercial?: string
  origem_mercadoria?: string
  produzido_escala_nao_relevante?: boolean
  fabricante?: string
  codigo_beneficio_fiscal?: string
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
  const { getCurrencyValue, applyMask } = useMask()
  const { taxGroups } = useTaxGroups()
  
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
    // Campos de precificação
    operational_expenses: 0,
    cost_with_additions: 0,
    representation_commission: 0,
    freight_on_purchase: 0,
    insurance_on_purchase: 0,
    minimum_sale_price: 0,
    seller_commission_amount: 0,
    seller_commission_percent: 0,
    ipi_on_purchase: 0,
    icms_on_purchase: 0,
    mva_profit_amount: 0,
    mva_profit_percent: 0,
    assembly_fee_amount: 0,
    assembly_fee_percent: 0,
    icms_st_on_purchase: 0,
    fcp_st_on_purchase: 0,
    last_purchase_value: 0,
    cost_calculation_method: "nfe_rules",
    desired_profit_margin: 0,
    competitor_prices: [],
    market_price_min: 0,
    market_price_max: 0,
    // Campos fiscais
    tax_group_id: "",
    grupo_tributario: "",
    cfop_padrao: "",
    codigo_ncm: "",
    codigo_cest: "",
    ean_codigo_barras: "",
    unidade_comercial: "UN",
    origem_mercadoria: "0",
    produzido_escala_nao_relevante: false,
    fabricante: "",
    codigo_beneficio_fiscal: "",
  })
  
  const [autoCalculatePrice, setAutoCalculatePrice] = useState(true)
  const [showCompetitorDialog, setShowCompetitorDialog] = useState(false)
  const [showScraperDialog, setShowScraperDialog] = useState(false)
  const [newCompetitor, setNewCompetitor] = useState({ name: "", price: 0, url: "" })

  // Estados para validação fiscal
  const [fiscalErrors, setFiscalErrors] = useState({
    ncm: "",
    cfop: "",
    cest: "",
  })
  const [showNCMSearchDialog, setShowNCMSearchDialog] = useState(false)

  // Estados para valores mascarados
  const [maskedCostPrice, setMaskedCostPrice] = useState("")
  const [maskedUnitPrice, setMaskedUnitPrice] = useState("")
  const [activeTab, setActiveTab] = useState("dados")
  const [priceAlert, setPriceAlert] = useState<{ 
    show: boolean
    message: string
    suggestedMargin: number
  }>({ 
    show: false, 
    message: "",
    suggestedMargin: 0
  })
  const [showSimulator, setShowSimulator] = useState(false)

  // Efeito para cálculo automático de preços
  useEffect(() => {
    if (!autoCalculatePrice) {
      setPriceAlert({ show: false, message: "", suggestedMargin: 0 })
      return
    }

    // Calcular preço de custo com acréscimos
    const costBase = formData.cost_price || 0
    const totalExpensesPercent = 
      (formData.operational_expenses || 0) +
      (formData.freight_on_purchase || 0) +
      (formData.insurance_on_purchase || 0) +
      (formData.ipi_on_purchase || 0) +
      (formData.icms_st_on_purchase || 0) +
      (formData.fcp_st_on_purchase || 0)
    
    const costWithAdditions = costBase * (1 + totalExpensesPercent / 100)
    
    // Calcular preço de venda baseado na margem de lucro desejada
    const profitMargin = formData.desired_profit_margin || 0
    let calculatedPrice = 0
    
    if (profitMargin > 0 && profitMargin < 100) {
      // Fórmula: Preço = Custo / (1 - Margem/100)
      calculatedPrice = costWithAdditions / (1 - profitMargin / 100)
    } else if (profitMargin === 0) {
      calculatedPrice = costWithAdditions
    }
    
    // Calcular MVA (Margem de Valor Agregado)
    const mvaAmount = calculatedPrice - costWithAdditions
    const mvaPercent = costWithAdditions > 0 ? (mvaAmount / costWithAdditions) * 100 : 0

    // Validar preço mínimo
    const minimumPrice = formData.minimum_sale_price || 0
    if (minimumPrice > 0 && calculatedPrice < minimumPrice) {
      const difference = minimumPrice - calculatedPrice
      
      // Calcular margem de lucro necessária para atingir o preço mínimo
      // Fórmula: Margem = (1 - Custo/PreçoMínimo) * 100
      const suggestedMargin = costWithAdditions > 0 
        ? ((1 - costWithAdditions / minimumPrice) * 100) 
        : 0
      
      setPriceAlert({
        show: true,
        message: `⚠️ Preço calculado (R$ ${calculatedPrice.toFixed(2)}) está R$ ${difference.toFixed(2)} abaixo do preço mínimo!`,
        suggestedMargin: parseFloat(suggestedMargin.toFixed(2))
      })
      
      toast({
        title: "Atenção: Preço Abaixo do Mínimo",
        description: `O preço de venda calculado (R$ ${calculatedPrice.toFixed(2)}) está abaixo do preço mínimo configurado (R$ ${minimumPrice.toFixed(2)}). Diferença: R$ ${difference.toFixed(2)}. Margem sugerida: ${suggestedMargin.toFixed(2)}%`,
        variant: "destructive",
      })
    } else {
      setPriceAlert({ show: false, message: "", suggestedMargin: 0 })
    }

    setFormData(prev => ({
      ...prev,
      cost_with_additions: parseFloat(costWithAdditions.toFixed(2)),
      unit_price: parseFloat(calculatedPrice.toFixed(2)),
      mva_profit_amount: parseFloat(mvaAmount.toFixed(2)),
      mva_profit_percent: parseFloat(mvaPercent.toFixed(2))
    }))

    // Atualizar valor mascarado do preço de venda
    setMaskedUnitPrice(applyMask((calculatedPrice * 100).toString(), 'currency'))
  }, [
    formData.cost_price,
    formData.operational_expenses,
    formData.freight_on_purchase,
    formData.insurance_on_purchase,
    formData.ipi_on_purchase,
    formData.icms_st_on_purchase,
    formData.fcp_st_on_purchase,
    formData.desired_profit_margin,
    formData.minimum_sale_price,
    autoCalculatePrice,
    toast
  ])

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

  // Funções de validação fiscal inline
  const validateNCM = (value: string) => {
    if (!value) {
      return "NCM é obrigatório"
    }
    if (value.length !== 8) {
      return "NCM deve ter exatamente 8 dígitos"
    }
    return ""
  }

  const validateCFOP = (value: string) => {
    if (value && value.length !== 4) {
      return "CFOP deve ter exatamente 4 dígitos"
    }
    return ""
  }

  const validateCEST = (value: string) => {
    if (value && value.length !== 7) {
      return "CEST deve ter exatamente 7 dígitos"
    }
    return ""
  }

  const handleNCMChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 8)
    setFormData(prev => ({ ...prev, codigo_ncm: numericValue }))
    setFiscalErrors(prev => ({ ...prev, ncm: validateNCM(numericValue) }))
  }

  const handleCFOPChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    setFormData(prev => ({ ...prev, cfop_padrao: numericValue }))
    setFiscalErrors(prev => ({ ...prev, cfop: validateCFOP(numericValue) }))
  }

  const handleCESTChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 7)
    setFormData(prev => ({ ...prev, codigo_cest: numericValue }))
    setFiscalErrors(prev => ({ ...prev, cest: validateCEST(numericValue) }))
  }

  const handleNCMSelect = (ncm: string) => {
    handleNCMChange(ncm)
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
      operational_expenses: 0,
      cost_with_additions: 0,
      representation_commission: 0,
      freight_on_purchase: 0,
      insurance_on_purchase: 0,
      minimum_sale_price: 0,
      seller_commission_amount: 0,
      seller_commission_percent: 0,
      ipi_on_purchase: 0,
      icms_on_purchase: 0,
      mva_profit_amount: 0,
      mva_profit_percent: 0,
      assembly_fee_amount: 0,
      assembly_fee_percent: 0,
      icms_st_on_purchase: 0,
      fcp_st_on_purchase: 0,
      last_purchase_value: 0,
      cost_calculation_method: "nfe_rules",
      desired_profit_margin: 0,
      competitor_prices: [],
      market_price_min: 0,
      market_price_max: 0,
      tax_group_id: "",
      grupo_tributario: "",
      cfop_padrao: "",
      codigo_ncm: "",
      codigo_cest: "",
      ean_codigo_barras: "",
      unidade_comercial: "UN",
      origem_mercadoria: "0",
      produzido_escala_nao_relevante: false,
      fabricante: "",
      codigo_beneficio_fiscal: "",
    })
    setMaskedCostPrice("")
    setMaskedUnitPrice("")
    setActiveTab("dados")
    setAutoCalculatePrice(true)
    setPriceAlert({ show: false, message: "", suggestedMargin: 0 })
    setFiscalErrors({ ncm: "", cfop: "", cest: "" })
    setEditingProduct(null)
  }

  const addCompetitor = () => {
    if (newCompetitor.name && newCompetitor.price > 0) {
      const updatedCompetitors = [...(formData.competitor_prices || []), { ...newCompetitor }]
      
      // Recalcular min e max
      const prices = updatedCompetitors.map(c => c.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      setFormData(prev => ({
        ...prev,
        competitor_prices: updatedCompetitors,
        market_price_min: minPrice,
        market_price_max: maxPrice,
      }))
      
      setNewCompetitor({ name: "", price: 0, url: "" })
      setShowCompetitorDialog(false)
      
      toast({
        title: "Concorrente Adicionado",
        description: `${newCompetitor.name} - R$ ${newCompetitor.price.toFixed(2)}`,
      })
    }
  }

  const removeCompetitor = (index: number) => {
    const updatedCompetitors = formData.competitor_prices?.filter((_, i) => i !== index) || []
    
    // Recalcular min e max
    if (updatedCompetitors.length > 0) {
      const prices = updatedCompetitors.map(c => c.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      setFormData(prev => ({
        ...prev,
        competitor_prices: updatedCompetitors,
        market_price_min: minPrice,
        market_price_max: maxPrice,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        competitor_prices: [],
        market_price_min: 0,
        market_price_max: 0,
      }))
    }
  }

  const getCompetitiveAnalysis = () => {
    const myPrice = formData.unit_price
    const minPrice = formData.market_price_min || 0
    const maxPrice = formData.market_price_max || 0
    const avgPrice = formData.competitor_prices && formData.competitor_prices.length > 0
      ? formData.competitor_prices.reduce((sum, c) => sum + c.price, 0) / formData.competitor_prices.length
      : 0
    
    if (minPrice === 0 || maxPrice === 0) {
      return { status: "no_data", message: "", color: "" }
    }
    
    const tolerance = 0.05 // 5% de tolerância
    
    if (myPrice < minPrice * (1 - tolerance)) {
      const diff = ((minPrice - myPrice) / minPrice * 100).toFixed(1)
      return {
        status: "too_low",
        message: `Seu preço está ${diff}% abaixo do menor preço de mercado. Você pode estar perdendo margem!`,
        color: "text-orange-600 dark:text-orange-400"
      }
    } else if (myPrice > maxPrice * (1 + tolerance)) {
      const diff = ((myPrice - maxPrice) / maxPrice * 100).toFixed(1)
      return {
        status: "too_high",
        message: `Seu preço está ${diff}% acima do maior preço de mercado. Pode dificultar vendas!`,
        color: "text-red-600 dark:text-red-400"
      }
    } else {
      const position = avgPrice > 0 
        ? myPrice < avgPrice ? "abaixo" : myPrice > avgPrice ? "acima" : "igual"
        : ""
      const diff = avgPrice > 0 ? Math.abs(((myPrice - avgPrice) / avgPrice * 100)).toFixed(1) : "0"
      return {
        status: "competitive",
        message: `Preço competitivo! ${diff}% ${position} da média de mercado (R$ ${avgPrice.toFixed(2)})`,
        color: "text-green-600 dark:text-green-400"
      }
    }
  }

  const applySuggestedMargin = () => {
    if (priceAlert.suggestedMargin > 0) {
      setFormData(prev => ({ 
        ...prev, 
        desired_profit_margin: priceAlert.suggestedMargin 
      }))
      
      toast({
        title: "Margem Aplicada",
        description: `Margem de lucro ajustada para ${priceAlert.suggestedMargin.toFixed(2)}% para atingir o preço mínimo.`,
      })
    }
  }

  // Calcular composição do preço para o simulador
  const calculatePriceBreakdown = () => {
    const costBase = formData.cost_price || 0
    const operationalExpenses = costBase * (formData.operational_expenses || 0) / 100
    const freight = costBase * (formData.freight_on_purchase || 0) / 100
    const insurance = costBase * (formData.insurance_on_purchase || 0) / 100
    const ipi = costBase * (formData.ipi_on_purchase || 0) / 100
    const icmsSt = costBase * (formData.icms_st_on_purchase || 0) / 100
    const fcpSt = costBase * (formData.fcp_st_on_purchase || 0) / 100
    
    const totalCosts = costBase + operationalExpenses + freight + insurance + ipi + icmsSt + fcpSt
    const profit = formData.unit_price - totalCosts
    const profitPercent = totalCosts > 0 ? (profit / totalCosts) * 100 : 0
    
    return {
      costBase,
      operationalExpenses,
      freight,
      insurance,
      ipi,
      icmsSt,
      fcpSt,
      totalCosts,
      profit,
      profitPercent,
      finalPrice: formData.unit_price
    }
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
        operational_expenses: product.operational_expenses || 0,
        cost_with_additions: product.cost_with_additions || 0,
        representation_commission: product.representation_commission || 0,
        freight_on_purchase: product.freight_on_purchase || 0,
        insurance_on_purchase: product.insurance_on_purchase || 0,
        minimum_sale_price: product.minimum_sale_price || 0,
        seller_commission_amount: product.seller_commission_amount || 0,
        seller_commission_percent: product.seller_commission_percent || 0,
        ipi_on_purchase: product.ipi_on_purchase || 0,
        icms_on_purchase: product.icms_on_purchase || 0,
        mva_profit_amount: product.mva_profit_amount || 0,
        mva_profit_percent: product.mva_profit_percent || 0,
        assembly_fee_amount: product.assembly_fee_amount || 0,
        assembly_fee_percent: product.assembly_fee_percent || 0,
        icms_st_on_purchase: product.icms_st_on_purchase || 0,
        fcp_st_on_purchase: product.fcp_st_on_purchase || 0,
        last_purchase_value: product.last_purchase_value || 0,
        cost_calculation_method: product.cost_calculation_method || "nfe_rules",
        desired_profit_margin: (product as any).desired_profit_margin || 0,
        competitor_prices: product.competitor_prices || [],
        market_price_min: product.market_price_min || 0,
        market_price_max: product.market_price_max || 0,
        tax_group_id: (product as any).tax_group_id || "",
        grupo_tributario: (product as any).grupo_tributario || "",
        cfop_padrao: (product as any).cfop_padrao || "",
        codigo_ncm: (product as any).codigo_ncm || "",
        codigo_cest: (product as any).codigo_cest || "",
        ean_codigo_barras: (product as any).ean_codigo_barras || "",
        unidade_comercial: (product as any).unidade_comercial || "UN",
        origem_mercadoria: (product as any).origem_mercadoria || "0",
        produzido_escala_nao_relevante: (product as any).produzido_escala_nao_relevante || false,
        fabricante: (product as any).fabricante || "",
        codigo_beneficio_fiscal: (product as any).codigo_beneficio_fiscal || "",
      })
      // Aplicar máscara aos preços
      setMaskedCostPrice(applyMask((product.cost_price * 100).toString(), 'currency'))
      setMaskedUnitPrice(applyMask((product.unit_price * 100).toString(), 'currency'))
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

    // Validações dos campos fiscais obrigatórios
    const errors = { ncm: "", cfop: "", cest: "" }
    let hasErrors = false

    // Validar Grupo Tributário (obrigatório)
    if (!formData.tax_group_id?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Grupo Tributário é obrigatório.",
        variant: "destructive",
      })
      setActiveTab("fiscal")
      return
    }

    // Validar NCM (obrigatório e deve ter 8 dígitos)
    if (!formData.codigo_ncm?.trim()) {
      errors.ncm = "Código NCM é obrigatório"
      hasErrors = true
    } else if (formData.codigo_ncm.length !== 8) {
      errors.ncm = "NCM deve ter exatamente 8 dígitos"
      hasErrors = true
    }

    // Validar CFOP (se preenchido, deve ter 4 dígitos)
    if (formData.cfop_padrao && formData.cfop_padrao.length !== 4) {
      errors.cfop = "CFOP deve ter exatamente 4 dígitos"
      hasErrors = true
    }

    // Validar CEST (se preenchido, deve ter 7 dígitos)
    if (formData.codigo_cest && formData.codigo_cest.length !== 7) {
      errors.cest = "CEST deve ter exatamente 7 dígitos"
      hasErrors = true
    }

    // Validar Unidade Comercial (obrigatório)
    if (!formData.unidade_comercial?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Unidade Comercial é obrigatória.",
        variant: "destructive",
      })
      setActiveTab("fiscal")
      return
    }

    if (hasErrors) {
      setFiscalErrors(errors)
      toast({
        title: "Erro de validação fiscal",
        description: "Corrija os erros nos campos fiscais antes de salvar.",
        variant: "destructive",
      })
      setActiveTab("fiscal")
      return
    }

    // Limpar erros se passou nas validações
    setFiscalErrors({ ncm: "", cfop: "", cest: "" })

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
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="bg-transparent border-b border-[#EEEEEE] rounded-none w-full justify-start h-auto p-0">
                  <TabsTrigger 
                    value="dados"
                    className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
                  >
                    Dados
                  </TabsTrigger>
                  <TabsTrigger 
                    value="precificacao"
                    className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
                  >
                    Precificação
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fiscal"
                    className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
                  >
                    Fiscal
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="mt-0">
                  <div className="space-y-6 p-6">
                    
                    {/* Card: Informações Básicas */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <CardTitle className="flex items-center gap-2">
                          📦 Informações Básicas do Produto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome do Produto <span className="text-red-500">*</span></Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Digite o nome do produto"
                              required
                              uppercase
                              blockSpecialChars
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="product_type">Tipo do Produto <span className="text-red-500">*</span></Label>
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
                            <Label htmlFor="product_genre">Tipo/Gênero <span className="text-red-500">*</span></Label>
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
                      </CardContent>
                    </Card>

                    {/* Card: Códigos e Identificação */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                        <CardTitle className="flex items-center gap-2">
                          🏷️ Códigos e Identificação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="system_code">Código do Sistema</Label>
                            <Input
                              id="system_code"
                              type="text"
                              value={formData.system_code || ''}
                              disabled
                              placeholder="Auto-gerado"
                              className="bg-muted"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sku">Código do Produto (SKU) <span className="text-red-500">*</span></Label>
                            <Input
                              id="sku"
                              type="text"
                              value={formData.sku}
                              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                              placeholder="Código alfanumérico"
                              required
                              style={{ fontFamily: 'monospace' }}
                              uppercase
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input
                              id="brand"
                              type="text"
                              value={formData.brand}
                              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                              placeholder="Digite a marca"
                              uppercase
                              blockSpecialChars
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Características do Produto */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                        <CardTitle className="flex items-center gap-2">
                          ⚙️ Características do Produto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="model">Modelo</Label>
                            <Input
                              id="model"
                              type="text"
                              value={formData.model}
                              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                              placeholder="Digite o modelo"
                              uppercase
                              blockSpecialChars
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
                      </CardContent>
                    </Card>

                    {/* Card: Fornecedor */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
                        <CardTitle className="flex items-center gap-2">
                          🏭 Fornecedor Padrão
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="supplier_code">Código Fornecedor Padrão</Label>
                            <Input
                              id="supplier_code"
                              type="text"
                              value={formData.supplier_code}
                              disabled
                              placeholder=""
                              className="bg-muted"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="supplier_id">Fornecedor Padrão</Label>
                            <div className="flex items-center gap-2">
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
                              <Button 
                                type="button" 
                                size="icon"
                                variant="outline"
                                title="Editar fornecedor"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Configurações de Visibilidade */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
                        <CardTitle className="flex items-center gap-2">
                          👁️ Configurações de Visibilidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <Switch
                              id="inactive"
                              checked={formData.inactive}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inactive: checked }))}
                            />
                            <Label htmlFor="inactive" className="cursor-pointer">Cadastro Inativo</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <Switch
                              id="hide_in_sales"
                              checked={formData.hide_in_sales}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hide_in_sales: checked }))}
                            />
                            <Label htmlFor="hide_in_sales" className="cursor-pointer">Ocultar nas Vendas</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <Switch
                              id="visible_in_catalog"
                              checked={formData.visible_in_catalog}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible_in_catalog: checked }))}
                            />
                            <Label htmlFor="visible_in_catalog" className="cursor-pointer">Visível no Catálogo</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </TabsContent>

                <TabsContent value="precificacao" className="mt-0">
                  <div className={styles.formContainer}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Custos e Precificação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Switch para cálculo automático */}
                        <div className="flex items-center space-x-2 mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Switch
                            id="auto-calculate"
                            checked={autoCalculatePrice}
                            onCheckedChange={setAutoCalculatePrice}
                          />
                          <Label htmlFor="auto-calculate" className="cursor-pointer">
                            Calcular preço de venda automaticamente
                          </Label>
                        </div>

                        {/* Alerta de preço abaixo do mínimo */}
                        {priceAlert.show && (
                          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-500">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                <span className="text-red-600 dark:text-red-400 text-lg font-bold">⚠️</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-red-800 dark:text-red-200 font-semibold text-sm mb-1">
                                  Atenção: Preço Abaixo do Mínimo Configurado
                                </h4>
                                <p className="text-red-700 dark:text-red-300 text-sm">
                                  O preço de venda calculado (R$ {formData.unit_price.toFixed(2)}) está abaixo do preço mínimo 
                                  configurado (R$ {formData.minimum_sale_price.toFixed(2)}). 
                                  <span className="font-semibold"> Diferença: R$ {(formData.minimum_sale_price - formData.unit_price).toFixed(2)}</span>
                                </p>
                                
                                {/* Sugestão de margem */}
                                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded-md border border-blue-300 dark:border-blue-700">
                                  <p className="text-blue-800 dark:text-blue-200 text-sm font-semibold mb-2">
                                    💡 Sugestão Automática:
                                  </p>
                                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                                    Para atingir o preço mínimo de R$ {formData.minimum_sale_price.toFixed(2)}, 
                                    a margem de lucro precisa ser de <span className="font-bold text-lg">{priceAlert.suggestedMargin.toFixed(2)}%</span>
                                    {formData.desired_profit_margin > 0 && (
                                      <span> (atual: {formData.desired_profit_margin.toFixed(2)}%)</span>
                                    )}
                                  </p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={applySuggestedMargin}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Aplicar Margem Sugerida ({priceAlert.suggestedMargin.toFixed(2)}%)
                                  </Button>
                                </div>

                                <p className="text-red-600 dark:text-red-400 text-xs mt-3">
                                  ⚙️ Outras opções: Aumente a margem de lucro manualmente ou reduza as despesas operacionais.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Linha 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="cost_price">Preço de Custo (R$) <span className="text-red-500">*</span></Label>
                            <Input
                              id="cost_price"
                              type="text"
                              value={maskedCostPrice}
                              onChange={(e) => setMaskedCostPrice(e.target.value)}
                              onValueChange={(unmasked) => {
                                const value = getCurrencyValue(applyMask(unmasked, 'currency'))
                                setFormData(prev => ({ ...prev, cost_price: value }))
                              }}
                              mask="currency"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="operational_expenses">Desp. Operacionais (%)</Label>
                            <Input
                              id="operational_expenses"
                              type="number"
                              value={formData.operational_expenses}
                              onChange={(e) => setFormData(prev => ({ ...prev, operational_expenses: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cost_with_additions">Preço de custo com Acréscimos</Label>
                            <Input
                              id="cost_with_additions"
                              type="text"
                              value={`R$ ${formData.cost_with_additions.toFixed(2)}`}
                              disabled
                              className="bg-muted font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="representation_commission">Comissão Representação (%)</Label>
                            <Input
                              id="representation_commission"
                              type="number"
                              value={formData.representation_commission}
                              onChange={(e) => setFormData(prev => ({ ...prev, representation_commission: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Linha 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="freight_on_purchase">Frete pago na Compra (%)</Label>
                            <Input
                              id="freight_on_purchase"
                              type="number"
                              value={formData.freight_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, freight_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="insurance_on_purchase">Seguro pago na Compra (%)</Label>
                            <Input
                              id="insurance_on_purchase"
                              type="number"
                              value={formData.insurance_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, insurance_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="minimum_sale_price">
                              Preço Mínimo Para Venda (R$)
                              {priceAlert.show && (
                                <Badge variant="destructive" className="ml-2 animate-pulse">
                                  Violado
                                </Badge>
                              )}
                            </Label>
                            <Input
                              id="minimum_sale_price"
                              type="number"
                              value={formData.minimum_sale_price}
                              onChange={(e) => setFormData(prev => ({ ...prev, minimum_sale_price: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                              className={cn(
                                priceAlert.show && "border-red-500 border-2"
                              )}
                            />
                            {priceAlert.show && (
                              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                ⚠️ {priceAlert.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="seller_commission_amount">Comissão Vendedor (R$)</Label>
                            <Input
                              id="seller_commission_amount"
                              type="number"
                              value={formData.seller_commission_amount}
                              onChange={(e) => setFormData(prev => ({ ...prev, seller_commission_amount: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="seller_commission_percent">Comissão Vendedor (%)</Label>
                            <Input
                              id="seller_commission_percent"
                              type="number"
                              value={formData.seller_commission_percent}
                              onChange={(e) => setFormData(prev => ({ ...prev, seller_commission_percent: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Linha 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="ipi_on_purchase">IPI pago na Compra (%)</Label>
                            <Input
                              id="ipi_on_purchase"
                              type="number"
                              value={formData.ipi_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, ipi_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="icms_on_purchase">ICMS pago na Compra (%)</Label>
                            <Input
                              id="icms_on_purchase"
                              type="number"
                              value={formData.icms_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, icms_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mva_profit_amount">(MVA) Lucro R$</Label>
                            <Input
                              id="mva_profit_amount"
                              type="text"
                              value={`R$ ${formData.mva_profit_amount.toFixed(2)}`}
                              disabled
                              className="bg-muted font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mva_profit_percent">(MVA) Lucro %</Label>
                            <Input
                              id="mva_profit_percent"
                              type="text"
                              value={`${formData.mva_profit_percent.toFixed(2)}%`}
                              disabled
                              className="bg-muted font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="assembly_fee_amount">Taxa Montagem (R$)</Label>
                            <Input
                              id="assembly_fee_amount"
                              type="number"
                              value={formData.assembly_fee_amount}
                              onChange={(e) => setFormData(prev => ({ ...prev, assembly_fee_amount: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Linha 4 - Margem de Lucro Desejada */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="desired_profit_margin" className="font-semibold text-primary">
                              Margem de Lucro Desejada (%)
                            </Label>
                            <Input
                              id="desired_profit_margin"
                              type="number"
                              value={formData.desired_profit_margin}
                              onChange={(e) => setFormData(prev => ({ ...prev, desired_profit_margin: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                              min="0"
                              max="99.99"
                              className="border-primary font-semibold"
                              disabled={!autoCalculatePrice}
                            />
                          </div>
                        </div>

                        {/* Linha 5 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="assembly_fee_percent">Taxa Montagem (%)</Label>
                            <Input
                              id="assembly_fee_percent"
                              type="number"
                              value={formData.assembly_fee_percent}
                              onChange={(e) => setFormData(prev => ({ ...prev, assembly_fee_percent: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="icms_st_on_purchase">ICMS ST pago na Compra (%)</Label>
                            <Input
                              id="icms_st_on_purchase"
                              type="number"
                              value={formData.icms_st_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, icms_st_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fcp_st_on_purchase">FCP ST pago na Compra (%)</Label>
                            <Input
                              id="fcp_st_on_purchase"
                              type="number"
                              value={formData.fcp_st_on_purchase}
                              onChange={(e) => setFormData(prev => ({ ...prev, fcp_st_on_purchase: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unit_price" className="text-green-600 font-semibold">
                              Preço de Venda (R$) {autoCalculatePrice ? '— Calculado' : '— Fixado'}
                              {priceAlert.show && (
                                <Badge variant="destructive" className="ml-2 animate-pulse">
                                  Abaixo do Mínimo
                                </Badge>
                              )}
                            </Label>
                            <Input
                              id="unit_price"
                              type="text"
                              value={maskedUnitPrice}
                              onChange={(e) => {
                                if (!autoCalculatePrice) {
                                  setMaskedUnitPrice(e.target.value)
                                }
                              }}
                              onValueChange={(unmasked) => {
                                if (!autoCalculatePrice) {
                                  const value = getCurrencyValue(applyMask(unmasked, 'currency'))
                                  setFormData(prev => ({ ...prev, unit_price: value }))
                                }
                              }}
                              mask="currency"
                              placeholder="R$ 0,00"
                              className={cn(
                                "font-bold text-lg",
                                priceAlert.show ? "bg-red-50 dark:bg-red-950 border-red-600 border-2" :
                                autoCalculatePrice ? "bg-green-50 dark:bg-green-950 border-green-600" : "border-green-600"
                              )}
                              disabled={autoCalculatePrice}
                            />
                          </div>
                        </div>

                        {/* Linha 6 - Valor última compra */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="last_purchase_value">Valor última compra (R$)</Label>
                            <Input
                              id="last_purchase_value"
                              type="number"
                              value={formData.last_purchase_value}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>

                        {/* Dropdown Forma de Cálculo */}
                        <div className="mt-6">
                          <Label htmlFor="cost_calculation_method">Forma de Cálculo Automático do Custo do Produto</Label>
                          <Select 
                            value={formData.cost_calculation_method} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, cost_calculation_method: value }))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Selecione o método de cálculo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nfe_rules">Aplicar regras das configurações da NFe</SelectItem>
                              <SelectItem value="historical_average">Tomar como base a média histórica</SelectItem>
                              <SelectItem value="last_entry">Tomar como base a última nota de entrada</SelectItem>
                              <SelectItem value="stock_balance">Tomar como base custo do saldo em estoque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Simulador Interativo */}
                        <div className="mt-8">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => setShowSimulator(!showSimulator)}
                          >
                            <span className="flex items-center gap-2">
                              🎯 Simulador Interativo de Precificação
                            </span>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              showSimulator && "rotate-180"
                            )} />
                          </Button>

                          {showSimulator && (
                            <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 animate-fade-in">
                              <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                                Visualize o Impacto de Cada Despesa no Preço Final
                              </h3>
                              
                              {/* Resumo Visual */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700">
                                  <p className="text-xs text-muted-foreground mb-1">Custo Base</p>
                                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    R$ {calculatePriceBreakdown().costBase.toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700">
                                  <p className="text-xs text-muted-foreground mb-1">Total de Despesas</p>
                                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    R$ {(calculatePriceBreakdown().totalCosts - calculatePriceBreakdown().costBase).toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-green-200 dark:border-green-700">
                                  <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    R$ {calculatePriceBreakdown().profit.toFixed(2)}
                                    <span className="text-sm ml-2">({calculatePriceBreakdown().profitPercent.toFixed(1)}%)</span>
                                  </p>
                                </div>
                              </div>

                              {/* Sliders Interativos */}
                              <div className="space-y-4 mb-6">
                                {/* Despesas Operacionais */}
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">Despesas Operacionais</Label>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      {formData.operational_expenses.toFixed(2)}% 
                                      (R$ {(calculatePriceBreakdown().operationalExpenses).toFixed(2)})
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="0.5"
                                    value={formData.operational_expenses}
                                    onChange={(e) => setFormData(prev => ({ ...prev, operational_expenses: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700 slider"
                                  />
                                </div>

                                {/* Frete */}
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">Frete na Compra</Label>
                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                      {formData.freight_on_purchase.toFixed(2)}% 
                                      (R$ {(calculatePriceBreakdown().freight).toFixed(2)})
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    step="0.5"
                                    value={formData.freight_on_purchase}
                                    onChange={(e) => setFormData(prev => ({ ...prev, freight_on_purchase: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer dark:bg-purple-700 slider"
                                  />
                                </div>

                                {/* IPI */}
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">IPI na Compra</Label>
                                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                      {formData.ipi_on_purchase.toFixed(2)}% 
                                      (R$ {(calculatePriceBreakdown().ipi).toFixed(2)})
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    step="0.5"
                                    value={formData.ipi_on_purchase}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ipi_on_purchase: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer dark:bg-pink-700 slider"
                                  />
                                </div>

                                {/* ICMS ST */}
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">ICMS ST na Compra</Label>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                      {formData.icms_st_on_purchase.toFixed(2)}% 
                                      (R$ {(calculatePriceBreakdown().icmsSt).toFixed(2)})
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    step="0.5"
                                    value={formData.icms_st_on_purchase}
                                    onChange={(e) => setFormData(prev => ({ ...prev, icms_st_on_purchase: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer dark:bg-indigo-700 slider"
                                  />
                                </div>

                                {/* Margem de Lucro */}
                                {autoCalculatePrice && (
                                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-300 dark:border-green-700">
                                    <div className="flex justify-between items-center mb-2">
                                      <Label className="text-sm font-semibold text-green-800 dark:text-green-200">Margem de Lucro Desejada</Label>
                                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                        {formData.desired_profit_margin.toFixed(2)}%
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="80"
                                      step="0.5"
                                      value={formData.desired_profit_margin}
                                      onChange={(e) => setFormData(prev => ({ ...prev, desired_profit_margin: parseFloat(e.target.value) }))}
                                      className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-700 slider"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Composição do Preço - Barra Visual */}
                              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                  Composição do Preço Final: R$ {formData.unit_price.toFixed(2)}
                                </h4>
                                <div className="space-y-2">
                                  {/* Custo Base */}
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Custo Base</span>
                                      <span className="font-semibold">R$ {calculatePriceBreakdown().costBase.toFixed(2)}</span>
                                    </div>
                                    <div className="h-4 bg-blue-500 rounded transition-all duration-300" 
                                         style={{ width: `${(calculatePriceBreakdown().costBase / formData.unit_price * 100).toFixed(1)}%` }}>
                                    </div>
                                  </div>

                                  {/* Despesas */}
                                  {calculatePriceBreakdown().operationalExpenses > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Desp. Operacionais</span>
                                        <span className="font-semibold">R$ {calculatePriceBreakdown().operationalExpenses.toFixed(2)}</span>
                                      </div>
                                      <div className="h-4 bg-orange-400 rounded transition-all duration-300" 
                                           style={{ width: `${(calculatePriceBreakdown().operationalExpenses / formData.unit_price * 100).toFixed(1)}%` }}>
                                      </div>
                                    </div>
                                  )}

                                  {calculatePriceBreakdown().freight > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Frete</span>
                                        <span className="font-semibold">R$ {calculatePriceBreakdown().freight.toFixed(2)}</span>
                                      </div>
                                      <div className="h-4 bg-purple-400 rounded transition-all duration-300" 
                                           style={{ width: `${(calculatePriceBreakdown().freight / formData.unit_price * 100).toFixed(1)}%` }}>
                                      </div>
                                    </div>
                                  )}

                                  {calculatePriceBreakdown().ipi > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>IPI</span>
                                        <span className="font-semibold">R$ {calculatePriceBreakdown().ipi.toFixed(2)}</span>
                                      </div>
                                      <div className="h-4 bg-pink-400 rounded transition-all duration-300" 
                                           style={{ width: `${(calculatePriceBreakdown().ipi / formData.unit_price * 100).toFixed(1)}%` }}>
                                      </div>
                                    </div>
                                  )}

                                  {calculatePriceBreakdown().icmsSt > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>ICMS ST</span>
                                        <span className="font-semibold">R$ {calculatePriceBreakdown().icmsSt.toFixed(2)}</span>
                                      </div>
                                      <div className="h-4 bg-indigo-400 rounded transition-all duration-300" 
                                           style={{ width: `${(calculatePriceBreakdown().icmsSt / formData.unit_price * 100).toFixed(1)}%` }}>
                                      </div>
                                    </div>
                                  )}

                                  {/* Lucro */}
                                  {calculatePriceBreakdown().profit > 0 && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold">Lucro</span>
                                        <span className="font-bold text-green-600">R$ {calculatePriceBreakdown().profit.toFixed(2)} ({calculatePriceBreakdown().profitPercent.toFixed(1)}%)</span>
                                      </div>
                                      <div className="h-4 bg-green-500 rounded transition-all duration-300" 
                                           style={{ width: `${(calculatePriceBreakdown().profit / formData.unit_price * 100).toFixed(1)}%` }}>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Análise de Concorrência */}
                        <div className="mt-8">
                          <Card className="border-2 border-purple-200 dark:border-purple-800">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                              <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  🎯 Análise de Concorrência
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setShowScraperDialog(true)}
                                    variant="outline"
                                    className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950"
                                  >
                                    <Search className="h-4 w-4 mr-1" />
                                    Buscar Automaticamente
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setShowCompetitorDialog(true)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Adicionar Manual
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                              {/* Status Competitivo */}
                              {formData.competitor_prices && formData.competitor_prices.length > 0 && (
                                <div className={cn(
                                  "p-4 rounded-lg mb-6 border-2 animate-fade-in",
                                  getCompetitiveAnalysis().status === "competitive" 
                                    ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                                    : getCompetitiveAnalysis().status === "too_high"
                                    ? "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"
                                    : "bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700"
                                )}>
                                  <div className="flex items-start gap-3">
                                    <div className="text-2xl">
                                      {getCompetitiveAnalysis().status === "competitive" ? "✅" : "⚠️"}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-1">
                                        {getCompetitiveAnalysis().status === "competitive" 
                                          ? "Preço Competitivo" 
                                          : getCompetitiveAnalysis().status === "too_high"
                                          ? "Preço Acima do Mercado"
                                          : "Preço Abaixo do Mercado"}
                                      </h4>
                                      <p className={cn("text-sm", getCompetitiveAnalysis().color)}>
                                        {getCompetitiveAnalysis().message}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Resumo de Preços */}
                              {formData.competitor_prices && formData.competitor_prices.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <p className="text-xs text-muted-foreground mb-1">Seu Preço</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      R$ {formData.unit_price.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-700">
                                    <p className="text-xs text-muted-foreground mb-1">Menor Preço</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                      R$ {formData.market_price_min.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-700">
                                    <p className="text-xs text-muted-foreground mb-1">Maior Preço</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                      R$ {formData.market_price_max.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-700">
                                    <p className="text-xs text-muted-foreground mb-1">Preço Médio</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                      R$ {(formData.competitor_prices.reduce((sum, c) => sum + c.price, 0) / formData.competitor_prices.length).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Lista de Concorrentes */}
                              {formData.competitor_prices && formData.competitor_prices.length > 0 ? (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold mb-3">Concorrentes Cadastrados</h4>
                                  {formData.competitor_prices.map((competitor, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                      <div className="flex-1">
                                        <p className="font-medium">{competitor.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          R$ {competitor.price.toFixed(2)}
                                          {competitor.url && (
                                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline text-xs">
                                              Ver produto
                                            </a>
                                          )}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={
                                          competitor.price < formData.unit_price ? "default" : 
                                          competitor.price > formData.unit_price ? "destructive" : "secondary"
                                        }>
                                          {competitor.price < formData.unit_price ? "Mais caro que você" : 
                                           competitor.price > formData.unit_price ? "Mais barato que você" : "Mesmo preço"}
                                        </Badge>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeCompetitor(index)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p>Nenhum concorrente cadastrado ainda.</p>
                                  <p className="text-sm mt-2">Adicione concorrentes para ver análise de preços de mercado.</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Scraper de Preços Automático */}
                        <CompetitorPriceScraper
                          open={showScraperDialog}
                          onOpenChange={setShowScraperDialog}
                          productName={formData.name}
                          onAddCompetitor={addCompetitor}
                        />

                        {/* Dialog para adicionar concorrente */}
                        <Dialog open={showCompetitorDialog} onOpenChange={setShowCompetitorDialog}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Concorrente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="competitor-name">Nome do Concorrente *</Label>
                                <Input
                                  id="competitor-name"
                                  value={newCompetitor.name}
                                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Ex: Mercado Livre, Amazon, Concorrente X"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="competitor-price">Preço do Produto *</Label>
                                <Input
                                  id="competitor-price"
                                  type="number"
                                  step="0.01"
                                  value={newCompetitor.price}
                                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="competitor-url">URL (opcional)</Label>
                                <Input
                                  id="competitor-url"
                                  type="url"
                                  value={newCompetitor.url}
                                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, url: e.target.value }))}
                                  placeholder="https://..."
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setShowCompetitorDialog(false)
                                    setNewCompetitor({ name: "", price: 0, url: "" })
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={addCompetitor}
                                  disabled={!newCompetitor.name || newCompetitor.price <= 0}
                                >
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="fiscal" className="mt-0">
                  <div className="space-y-6 p-6">
                    
                    {/* Card: Informações Fiscais Básicas */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                        <CardTitle className="flex items-center gap-2">
                          📋 Informações Fiscais Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tax_group_id">Grupo Tributário <span className="text-primary">*</span></Label>
                            <Select
                              value={formData.tax_group_id}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, tax_group_id: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o grupo tributário" />
                              </SelectTrigger>
                              <SelectContent>
                                {taxGroups.filter(g => g.is_active).map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cfop_padrao">CFOP Padrão</Label>
                            <Input
                              id="cfop_padrao"
                              type="text"
                              maxLength={4}
                              value={formData.cfop_padrao}
                              onChange={(e) => handleCFOPChange(e.target.value)}
                              placeholder="0000"
                              className={cn(fiscalErrors.cfop && "border-red-500")}
                            />
                            {fiscalErrors.cfop && (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                ⚠️ {fiscalErrors.cfop}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="codigo_ncm">Código NCM <span className="text-primary">*</span></Label>
                            <div className="flex gap-2">
                              <Input
                                id="codigo_ncm"
                                type="text"
                                maxLength={8}
                                value={formData.codigo_ncm}
                                onChange={(e) => handleNCMChange(e.target.value)}
                                placeholder="00000000"
                                className={cn(fiscalErrors.ncm && "border-red-500", "flex-1")}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNCMSearchDialog(true)}
                                className="shrink-0"
                                title="Buscar NCM pela descrição do produto"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </div>
                            {fiscalErrors.ncm ? (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                ⚠️ {fiscalErrors.ncm}
                              </p>
                            ) : formData.codigo_ncm && formData.codigo_ncm.length === 8 && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                ✓ NCM válido: {formData.codigo_ncm.substring(0, 4)}.{formData.codigo_ncm.substring(4, 6)}.{formData.codigo_ncm.substring(6, 8)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Códigos e Identificação */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                        <CardTitle className="flex items-center gap-2">
                          🔢 Códigos e Identificação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="codigo_cest">Código CEST</Label>
                            <Input
                              id="codigo_cest"
                              type="text"
                              maxLength={7}
                              value={formData.codigo_cest}
                              onChange={(e) => handleCESTChange(e.target.value)}
                              placeholder="0000000"
                              className={cn(fiscalErrors.cest && "border-red-500")}
                            />
                            {fiscalErrors.cest && (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                ⚠️ {fiscalErrors.cest}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ean_codigo_barras">EAN - CÓDIGO DE BARRAS</Label>
                            <Input
                              id="ean_codigo_barras"
                              type="text"
                              value={formData.ean_codigo_barras}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '')
                                setFormData(prev => ({ ...prev, ean_codigo_barras: value }))
                              }}
                              placeholder="Código de barras"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unidade_comercial">Unidade Comercial <span className="text-primary">*</span></Label>
                            <Input
                              id="unidade_comercial"
                              type="text"
                              maxLength={6}
                              value={formData.unidade_comercial}
                              onChange={(e) => setFormData(prev => ({ ...prev, unidade_comercial: e.target.value.toUpperCase() }))}
                              placeholder="UN"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Origem e Características */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                        <CardTitle className="flex items-center gap-2">
                          🌍 Origem e Características
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="origem_mercadoria">Origem da Mercadoria <span className="text-primary">*</span></Label>
                            <Select 
                              value={formData.origem_mercadoria} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, origem_mercadoria: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a origem" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 - Nacional</SelectItem>
                                <SelectItem value="1">1 - Estrangeira - Importação Direta</SelectItem>
                                <SelectItem value="2">2 - Estrangeira - Adquirida no Mercado Interno</SelectItem>
                                <SelectItem value="3">3 - Nacional - Mercadoria com Conteúdo de Importação &gt; 40%</SelectItem>
                                <SelectItem value="4">4 - Nacional - Produção em Conformidade com Processos Produtivos Básicos</SelectItem>
                                <SelectItem value="5">5 - Nacional - Mercadoria com Conteúdo de Importação ≤ 40%</SelectItem>
                                <SelectItem value="6">6 - Estrangeira - Importação Direta, sem Similar Nacional</SelectItem>
                                <SelectItem value="7">7 - Estrangeira - Adquirida no Mercado Interno, sem Similar Nacional</SelectItem>
                                <SelectItem value="8">8 - Nacional - Mercadoria com Conteúdo de Importação &gt; 70%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabricante">Fabricante</Label>
                            <Input
                              id="fabricante"
                              type="text"
                              value={formData.fabricante}
                              onChange={(e) => setFormData(prev => ({ ...prev, fabricante: e.target.value }))}
                              placeholder="Nome do fabricante"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <Label htmlFor="produzido_escala_nao_relevante" className="cursor-pointer font-medium">
                              Produzido em Escala Não Relevante
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Indica se o produto é fabricado em pequena escala
                            </p>
                          </div>
                          <Switch
                            id="produzido_escala_nao_relevante"
                            checked={formData.produzido_escala_nao_relevante}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, produzido_escala_nao_relevante: checked }))}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Benefícios Fiscais */}
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                        <CardTitle className="flex items-center gap-2">
                          🎁 Benefícios Fiscais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="codigo_beneficio_fiscal">Código de Benefício Fiscal</Label>
                          <Input
                            id="codigo_beneficio_fiscal"
                            type="text"
                            value={formData.codigo_beneficio_fiscal}
                            onChange={(e) => setFormData(prev => ({ ...prev, codigo_beneficio_fiscal: e.target.value }))}
                            placeholder="Código conforme legislação estadual"
                          />
                          <p className="text-xs text-muted-foreground">
                            Código do benefício fiscal utilizado pela unidade federativa (conforme legislação estadual)
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dialog de Busca de NCM */}
                    <NCMSearchDialog
                      open={showNCMSearchDialog}
                      onOpenChange={setShowNCMSearchDialog}
                      onSelect={handleNCMSelect}
                      productName={formData.name}
                    />

                  </div>
                </TabsContent>
              </Tabs>
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
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
                <TableHead className="w-[40px] h-10 px-3">
                  <Checkbox 
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead className="w-[40px] h-10 px-2">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </TableHead>
                <TableHead className="w-[60px] h-10 px-3 text-xs font-semibold text-foreground">Tipo</TableHead>
                <TableHead className="w-[100px] h-10 px-3 text-xs font-semibold text-foreground">
                  Cód. Sistema
                  <ChevronDown className="inline h-3 w-3 ml-1 text-muted-foreground" />
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
                  <TableCell colSpan={11} className="text-center py-16 bg-background">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "Tente alterar os filtros de busca" : "Comece criando seu primeiro produto"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className={cn(
                      "border-b border-border transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10",
                      "hover:bg-muted/30"
                    )}
                  >
                    <TableCell className="px-3 py-2.5">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-2.5">
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Circle className="h-4 w-4 text-muted-foreground fill-muted-foreground/20" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-sm font-semibold text-foreground">{product.system_code || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-primary font-bold">{product.sku || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm font-semibold text-foreground">{product.name}</TableCell>
                    <TableCell className="px-3 py-2.5 text-center">
                      {!product.hide_in_sales && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-500 mx-auto font-bold" />
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground/90">{product.brand || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground/90">{product.model || "-"}</TableCell>
                    <TableCell className="px-3 py-2.5 text-sm text-foreground/90">{getSupplierName(product.supplier_id) || "-"}</TableCell>
                    <TableCell className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => openForm(product)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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