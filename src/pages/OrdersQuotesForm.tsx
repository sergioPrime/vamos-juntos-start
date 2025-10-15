import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, FileText, CreditCard, Truck, Calculator, FileSignature, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { useSidebarConfig } from "@/contexts/SidebarConfigContext"
import { OrderQuoteDataTab } from "@/components/orders-quotes/OrderQuoteDataTab"

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

const OrdersQuotesForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  const { } = useSidebarConfig()
  
  const [formData, setFormData] = useState<OrderQuoteFormData>({
    number: '',
    type: 'order',
    status: 'draft',
    sales_origin: '',
    category: '',
    price_table: '',
    warehouse: '',
    seller: '',
    system_status: 'draft',
    total_amount: 0,
    items: [],
    generate_service_order: false
  })
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("dados")

  useEffect(() => {
    if (id) {
      loadOrderQuote(id)
    } else {
      generateNumber()
    }
  }, [id])

  const generateNumber = () => {
    // Não gerar número aqui - será gerado automaticamente pelo banco de dados
    // através do trigger set_order_number que usa generate_next_order_number
  }

  const loadOrderQuote = async (orderQuoteId: string) => {
    // TODO: Load existing order/quote data
    console.log('Loading order/quote:', orderQuoteId)
  }

  const handleSave = async () => {
    if (!formData.number.trim()) {
      toast({
        title: "Erro de validação",
        description: "Número é obrigatório.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // TODO: Save order/quote to database
      console.log('Saving:', formData)
      
      toast({
        title: "Sucesso!",
        description: `${formData.type === 'order' ? 'Pedido' : 'Orçamento'} salvo com sucesso.`,
      })
      
      navigate('/orders-quotes')
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (updates: Partial<OrderQuoteFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + item.total_price, 0)
    updateFormData({ total_amount: total })
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/orders-quotes')}
              className="p-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {id ? 'Editar' : 'Cadastro de'} Pedidos e Orçamentos
              </h1>
              <p className="text-muted-foreground">
                {formData.number && `${formData.type === 'order' ? 'Pedido' : 'Orçamento'}: ${formData.number}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button
              variant="outline" 
              onClick={() => navigate('/orders-quotes')}
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="w-full">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dados" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="entrega" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Entrega
                </TabsTrigger>
                <TabsTrigger value="impostos" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Impostos
                </TabsTrigger>
                <TabsTrigger value="observacoes" className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Observações / Termos
                </TabsTrigger>
                {formData.generate_service_order && (
                  <TabsTrigger value="ordem-servico" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Ordem de Serviço
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="dados" className="mt-6">
                <OrderQuoteDataTab
                  formData={formData}
                  onUpdateFormData={updateFormData}
                  onCalculateTotal={calculateTotal}
                />
              </TabsContent>

              <TabsContent value="pagamentos" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aba de Pagamentos será implementada em breve</p>
                </div>
              </TabsContent>

              <TabsContent value="entrega" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aba de Entrega será implementada em breve</p>
                </div>
              </TabsContent>

              <TabsContent value="impostos" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aba de Impostos será implementada em breve</p>
                </div>
              </TabsContent>

              <TabsContent value="observacoes" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aba de Observações / Termos será implementada em breve</p>
                </div>
              </TabsContent>

              {formData.generate_service_order && (
                <TabsContent value="ordem-servico" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aba de Ordem de Serviço será implementada em breve</p>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* Service Order Toggle */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Gerar Ordem de Serviço</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa automaticamente uma nova aba para configuração da ordem de serviço
                  </p>
                </div>
                <Switch
                  checked={formData.generate_service_order}
                  onCheckedChange={(checked) => updateFormData({ generate_service_order: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OrdersQuotesForm