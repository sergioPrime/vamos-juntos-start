import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Users, Truck, Package, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  sku?: string
  unit: string
}

interface Customer {
  id: string
  name: string
  email?: string
}

interface Supplier {
  id: string
  company_name: string
  contact_person?: string
}

interface Warehouse {
  id: string
  name: string
  location?: string
}

interface ReturnManagementProps {
  onSuccess: () => void
}

export const ReturnManagement = ({ onSuccess }: ReturnManagementProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [activeTab, setActiveTab] = useState("customer_return")
  
  // Customer Return Form
  const [customerReturnData, setCustomerReturnData] = useState({
    customer_id: "",
    product_id: "",
    warehouse_id: "",
    quantity: 0,
    return_reason: "",
    condition: "good", // good, damaged, expired
    action: "restock", // restock, discard, repair
    order_reference: "",
    notes: ""
  })

  // Supplier Return Form
  const [supplierReturnData, setSupplierReturnData] = useState({
    supplier_id: "",
    product_id: "",
    warehouse_id: "",
    quantity: 0,
    return_reason: "",
    condition: "defective", // defective, wrong_item, expired
    status: "pending", // pending, shipped, completed
    purchase_reference: "",
    expected_credit: 0,
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [currentOrg])

  const loadData = async () => {
    if (!currentOrg?.id) return

    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, unit')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      // Load customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('org_id', currentOrg.id)
        .order('name')

      // Create mock suppliers since we need to match the expected structure
      const suppliersData = [
        { id: '1', company_name: 'Fornecedor A', contact_person: 'João Silva' },
        { id: '2', company_name: 'Fornecedor B', contact_person: 'Maria Santos' }
      ]

      // Create mock warehouses since table doesn't exist yet
      const warehousesData = [
        { id: '1', name: 'Armazém Principal', location: 'Sede' },
        { id: '2', name: 'Armazém Secundário', location: 'Filial' }
      ]

      setProducts(productsData || [])
      setCustomers(customersData || [])
      setSuppliers(suppliersData || [])
      setWarehouses(warehousesData || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      })
    }
  }

  const handleCustomerReturn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerReturnData.customer_id || !customerReturnData.product_id || !customerReturnData.warehouse_id || customerReturnData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      // Only create stock entry if action is "restock" and condition is "good"
      if (customerReturnData.action === "restock" && customerReturnData.condition === "good") {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: customerReturnData.product_id,
            warehouse_id: customerReturnData.warehouse_id,
            movement_type: 'in',
            quantity: customerReturnData.quantity,
            reference_type: 'customer_return',
            reference_id: customerReturnData.order_reference || null,
            notes: `Devolução de cliente - Motivo: ${customerReturnData.return_reason} - Condição: ${getConditionLabel(customerReturnData.condition)} - ${customerReturnData.notes}`,
            org_id: currentOrg?.id,
            created_by: user?.id,
          })

        if (movementError) throw movementError
      } else {
        // Log the return without affecting stock
        const { error: logError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: customerReturnData.product_id,
            warehouse_id: customerReturnData.warehouse_id,
            movement_type: 'adjustment',
            quantity: 0, // No stock impact
            reference_type: 'customer_return_logged',
            reference_id: customerReturnData.order_reference || null,
            notes: `Devolução de cliente registrada - Motivo: ${customerReturnData.return_reason} - Condição: ${getConditionLabel(customerReturnData.condition)} - Ação: ${getActionLabel(customerReturnData.action)} - ${customerReturnData.notes}`,
            org_id: currentOrg?.id,
            created_by: user?.id,
          })

        if (logError) throw logError
      }

      toast({
        title: "Devolução de cliente registrada",
        description: customerReturnData.action === "restock" && customerReturnData.condition === "good" 
          ? "A devolução foi registrada e o estoque foi atualizado."
          : "A devolução foi registrada para acompanhamento.",
      })

      // Reset form
      setCustomerReturnData({
        customer_id: "",
        product_id: "",
        warehouse_id: "",
        quantity: 0,
        return_reason: "",
        condition: "good",
        action: "restock",
        order_reference: "",
        notes: ""
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao registrar devolução",
        description: "Ocorreu um erro ao registrar a devolução do cliente.",
        variant: "destructive",
      })
    }
  }

  const handleSupplierReturn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierReturnData.supplier_id || !supplierReturnData.product_id || !supplierReturnData.warehouse_id || supplierReturnData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create outbound stock movement for supplier return
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: supplierReturnData.product_id,
          warehouse_id: supplierReturnData.warehouse_id,
          movement_type: 'out',
          quantity: supplierReturnData.quantity,
          reference_type: 'supplier_return',
          reference_id: supplierReturnData.purchase_reference || null,
          notes: `Devolução ao fornecedor - Motivo: ${supplierReturnData.return_reason} - Condição: ${getSupplierConditionLabel(supplierReturnData.condition)} - Status: ${getStatusLabel(supplierReturnData.status)} - ${supplierReturnData.notes}`,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (movementError) throw movementError

      toast({
        title: "Devolução ao fornecedor registrada",
        description: "A devolução foi registrada e o estoque foi reduzido.",
      })

      // Reset form
      setSupplierReturnData({
        supplier_id: "",
        product_id: "",
        warehouse_id: "",
        quantity: 0,
        return_reason: "",
        condition: "defective",
        status: "pending",
        purchase_reference: "",
        expected_credit: 0,
        notes: ""
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao registrar devolução",
        description: "Ocorreu um erro ao registrar a devolução ao fornecedor.",
        variant: "destructive",
      })
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'good': return 'Bom estado'
      case 'damaged': return 'Danificado'
      case 'expired': return 'Vencido'
      default: return condition
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'restock': return 'Reestocar'
      case 'discard': return 'Descartar'
      case 'repair': return 'Enviar para reparo'
      default: return action
    }
  }

  const getSupplierConditionLabel = (condition: string) => {
    switch (condition) {
      case 'defective': return 'Defeituoso'
      case 'wrong_item': return 'Item errado'
      case 'expired': return 'Vencido'
      default: return condition
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'shipped': return 'Enviado'
      case 'completed': return 'Concluído'
      default: return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-orange-600" />
          Gestão de Devoluções
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer_return" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Devolução de Cliente
            </TabsTrigger>
            <TabsTrigger value="supplier_return" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Devolução ao Fornecedor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer_return" className="space-y-6">
            <form onSubmit={handleCustomerReturn} className="space-y-6">
              {/* Customer and Product Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Cliente *</Label>
                  <Select value={customerReturnData.customer_id} onValueChange={(value) => setCustomerReturnData(prev => ({...prev, customer_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {customer.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product">Produto *</Label>
                  <Select value={customerReturnData.product_id} onValueChange={(value) => setCustomerReturnData(prev => ({...prev, product_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {product.name} ({product.sku || 'Sem SKU'})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="warehouse">Armazém *</Label>
                  <Select value={customerReturnData.warehouse_id} onValueChange={(value) => setCustomerReturnData(prev => ({...prev, warehouse_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o armazém" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="0.01"
                    value={customerReturnData.quantity}
                    onChange={(e) => setCustomerReturnData(prev => ({...prev, quantity: Number(e.target.value)}))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="condition">Condição *</Label>
                  <Select value={customerReturnData.condition} onValueChange={(value) => setCustomerReturnData(prev => ({...prev, condition: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Bom estado
                        </div>
                      </SelectItem>
                      <SelectItem value="damaged">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Danificado
                        </div>
                      </SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          Vencido
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="return_reason">Motivo da Devolução *</Label>
                  <Input
                    id="return_reason"
                    value={customerReturnData.return_reason}
                    onChange={(e) => setCustomerReturnData(prev => ({...prev, return_reason: e.target.value}))}
                    placeholder="Motivo da devolução"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="action">Ação a ser tomada *</Label>
                  <Select value={customerReturnData.action} onValueChange={(value) => setCustomerReturnData(prev => ({...prev, action: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Reestocar</SelectItem>
                      <SelectItem value="discard">Descartar</SelectItem>
                      <SelectItem value="repair">Enviar para reparo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="order_reference">Referência do Pedido</Label>
                <Input
                  id="order_reference"
                  value={customerReturnData.order_reference}
                  onChange={(e) => setCustomerReturnData(prev => ({...prev, order_reference: e.target.value}))}
                  placeholder="Número do pedido ou NF"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={customerReturnData.notes}
                  onChange={(e) => setCustomerReturnData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Observações sobre a devolução"
                  rows={3}
                />
              </div>

              {customerReturnData.action !== "restock" || customerReturnData.condition !== "good" ? (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Esta devolução será registrada apenas para acompanhamento e não afetará o estoque.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Esta devolução será reestocada e aumentará o estoque disponível.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Devolução
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="supplier_return" className="space-y-6">
            <form onSubmit={handleSupplierReturn} className="space-y-6">
              {/* Supplier and Product Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <Select value={supplierReturnData.supplier_id} onValueChange={(value) => setSupplierReturnData(prev => ({...prev, supplier_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {supplier.company_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product">Produto *</Label>
                  <Select value={supplierReturnData.product_id} onValueChange={(value) => setSupplierReturnData(prev => ({...prev, product_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {product.name} ({product.sku || 'Sem SKU'})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="warehouse">Armazém *</Label>
                  <Select value={supplierReturnData.warehouse_id} onValueChange={(value) => setSupplierReturnData(prev => ({...prev, warehouse_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o armazém" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="0.01"
                    value={supplierReturnData.quantity}
                    onChange={(e) => setSupplierReturnData(prev => ({...prev, quantity: Number(e.target.value)}))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="condition">Condição *</Label>
                  <Select value={supplierReturnData.condition} onValueChange={(value) => setSupplierReturnData(prev => ({...prev, condition: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">Defeituoso</SelectItem>
                      <SelectItem value="wrong_item">Item errado</SelectItem>
                      <SelectItem value="expired">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="return_reason">Motivo da Devolução *</Label>
                  <Input
                    id="return_reason"
                    value={supplierReturnData.return_reason}
                    onChange={(e) => setSupplierReturnData(prev => ({...prev, return_reason: e.target.value}))}
                    placeholder="Motivo da devolução"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={supplierReturnData.status} onValueChange={(value) => setSupplierReturnData(prev => ({...prev, status: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expected_credit">Crédito Esperado</Label>
                  <Input
                    id="expected_credit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={supplierReturnData.expected_credit}
                    onChange={(e) => setSupplierReturnData(prev => ({...prev, expected_credit: Number(e.target.value)}))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purchase_reference">Referência da Compra</Label>
                <Input
                  id="purchase_reference"
                  value={supplierReturnData.purchase_reference}
                  onChange={(e) => setSupplierReturnData(prev => ({...prev, purchase_reference: e.target.value}))}
                  placeholder="Número da NF de compra"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={supplierReturnData.notes}
                  onChange={(e) => setSupplierReturnData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Observações sobre a devolução"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">
                    Esta devolução reduzirá o estoque disponível.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Devolução
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}