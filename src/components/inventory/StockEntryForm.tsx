import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Package, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Product {
  id: string
  name: string
  sku?: string
  unit: string
  has_lot_control: boolean
  has_serial_control: boolean
  is_perishable: boolean
}

interface Warehouse {
  id: string
  name: string
  location?: string
}

interface StockEntryFormProps {
  onSuccess: () => void
}

export const StockEntryForm = ({ onSuccess }: StockEntryFormProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [formData, setFormData] = useState({
    product_id: "",
    warehouse_id: "",
    quantity: 0,
    entry_type: "manual", // manual, return, bonus, purchase
    lot_number: "",
    serial_numbers: "",
    expiration_date: "",
    unit_cost: 0,
    total_cost: 0,
    supplier_info: "",
    reference_document: "",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [currentOrg])

  useEffect(() => {
    if (formData.quantity && formData.unit_cost) {
      setFormData(prev => ({
        ...prev,
        total_cost: prev.quantity * prev.unit_cost
      }))
    }
  }, [formData.quantity, formData.unit_cost])

  const loadData = async () => {
    if (!currentOrg?.id) return

    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, unit, has_lot_control, has_serial_control, is_perishable')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      // Load warehouses
      const { data: warehousesData } = await supabase
        .from('warehouses')
        .select('id, name, location')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('name')

      setProducts(productsData || [])
      setWarehouses(warehousesData || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      })
    }
  }

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
    setFormData(prev => ({ ...prev, product_id: productId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.warehouse_id || formData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validate lot control
    if (selectedProduct?.has_lot_control && !formData.lot_number) {
      toast({
        title: "Lote obrigatório",
        description: "Este produto requer controle de lote.",
        variant: "destructive",
      })
      return
    }

    // Validate expiration for perishable products
    if (selectedProduct?.is_perishable && !formData.expiration_date) {
      toast({
        title: "Data de validade obrigatória",
        description: "Este produto requer controle de validade.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: formData.product_id,
          warehouse_id: formData.warehouse_id,
          movement_type: 'in',
          quantity: formData.quantity,
          lot_id: formData.lot_number || null,
          expiration_date: formData.expiration_date || null,
          reference_type: formData.entry_type,
          reference_id: formData.reference_document || null,
          notes: `${getEntryTypeLabel(formData.entry_type)} - ${formData.notes}`,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (movementError) throw movementError

      // Handle lot creation if needed
      if (selectedProduct?.has_lot_control && formData.lot_number) {
        const { error: lotError } = await supabase
          .from('product_lots')
          .upsert({
            product_id: formData.product_id,
            lot_number: formData.lot_number,
            expiration_date: formData.expiration_date || null,
            quantity: formData.quantity,
            status: 'active',
            org_id: currentOrg?.id,
            created_by: user?.id,
          })

        if (lotError) throw lotError
      }

      // Handle serial numbers if needed
      if (selectedProduct?.has_serial_control && formData.serial_numbers) {
        const serials = formData.serial_numbers.split('\n').filter(s => s.trim())
        const serialInserts = serials.map(serial => ({
          product_id: formData.product_id,
          serial_number: serial.trim(),
          status: 'available' as const,
          warehouse_id: formData.warehouse_id,
          org_id: currentOrg?.id,
          created_by: user?.id,
        }))

        const { error: serialError } = await supabase
          .from('product_serials')
          .insert(serialInserts)

        if (serialError) throw serialError
      }

      toast({
        title: "Entrada registrada",
        description: "A entrada de estoque foi registrada com sucesso.",
      })

      // Reset form
      setFormData({
        product_id: "",
        warehouse_id: "",
        quantity: 0,
        entry_type: "manual",
        lot_number: "",
        serial_numbers: "",
        expiration_date: "",
        unit_cost: 0,
        total_cost: 0,
        supplier_info: "",
        reference_document: "",
        notes: ""
      })
      setSelectedProduct(null)
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao registrar entrada",
        description: "Ocorreu um erro ao registrar a entrada de estoque.",
        variant: "destructive",
      })
    }
  }

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case 'manual': return 'Entrada Manual'
      case 'return': return 'Devolução'
      case 'bonus': return 'Bonificação'
      case 'purchase': return 'Compra'
      default: return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Entrada de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Produto *</Label>
              <Select value={formData.product_id} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {product.name} ({product.sku || 'Sem SKU'}) - {product.unit}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warehouse">Armazém/Local *</Label>
              <Select value={formData.warehouse_id} onValueChange={(value) => setFormData(prev => ({...prev, warehouse_id: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o armazém" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.location && `- ${warehouse.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entry_type">Tipo de Entrada *</Label>
              <Select value={formData.entry_type} onValueChange={(value) => setFormData(prev => ({...prev, entry_type: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Entrada Manual</SelectItem>
                  <SelectItem value="return">Devolução de Cliente</SelectItem>
                  <SelectItem value="bonus">Bonificação</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
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
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: Number(e.target.value)}))}
                required
              />
              {selectedProduct && (
                <p className="text-sm text-muted-foreground mt-1">
                  Unidade: {selectedProduct.unit}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="unit_cost">Custo Unitário</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({...prev, unit_cost: Number(e.target.value)}))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Lot and Serial Control */}
          {selectedProduct && (selectedProduct.has_lot_control || selectedProduct.has_serial_control || selectedProduct.is_perishable) && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Controles Especiais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProduct.has_lot_control && (
                  <div>
                    <Label htmlFor="lot_number">Número do Lote *</Label>
                    <Input
                      id="lot_number"
                      value={formData.lot_number}
                      onChange={(e) => setFormData(prev => ({...prev, lot_number: e.target.value}))}
                      placeholder="Ex: L202501001"
                      required={selectedProduct.has_lot_control}
                    />
                  </div>
                )}

                {selectedProduct.is_perishable && (
                  <div>
                    <Label htmlFor="expiration_date">Data de Validade *</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData(prev => ({...prev, expiration_date: e.target.value}))}
                      required={selectedProduct.is_perishable}
                    />
                  </div>
                )}
              </div>

              {selectedProduct.has_serial_control && (
                <div>
                  <Label htmlFor="serial_numbers">Números de Série (um por linha)</Label>
                  <Textarea
                    id="serial_numbers"
                    value={formData.serial_numbers}
                    onChange={(e) => setFormData(prev => ({...prev, serial_numbers: e.target.value}))}
                    placeholder="SN001&#10;SN002&#10;SN003"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Digite um número de série por linha
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_info">Fornecedor/Origem</Label>
              <Input
                id="supplier_info"
                value={formData.supplier_info}
                onChange={(e) => setFormData(prev => ({...prev, supplier_info: e.target.value}))}
                placeholder="Nome do fornecedor ou origem"
              />
            </div>

            <div>
              <Label htmlFor="reference_document">Documento de Referência</Label>
              <Input
                id="reference_document"
                value={formData.reference_document}
                onChange={(e) => setFormData(prev => ({...prev, reference_document: e.target.value}))}
                placeholder="NF, recibo, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Observações adicionais sobre a entrada"
              rows={3}
            />
          </div>

          {formData.total_cost > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">
                Valor Total da Entrada: R$ {formData.total_cost.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Entrada
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}