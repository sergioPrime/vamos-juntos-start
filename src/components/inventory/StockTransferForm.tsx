import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, Package, AlertTriangle } from "lucide-react"
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
}

interface Warehouse {
  id: string
  name: string
  location?: string
}

interface WarehouseStock {
  warehouse_id: string
  warehouse_name: string
  quantity: number
}

interface ProductLot {
  id: string
  lot_number: string
  quantity: number
  expiration_date?: string
}

interface StockTransferFormProps {
  onSuccess: () => void
}

export const StockTransferForm = ({ onSuccess }: StockTransferFormProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([])
  const [availableLots, setAvailableLots] = useState<ProductLot[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [formData, setFormData] = useState({
    product_id: "",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    quantity: 0,
    lot_id: "",
    transfer_reason: "",
    reference_document: "",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [currentOrg])

  useEffect(() => {
    if (formData.product_id) {
      loadWarehouseStock(formData.product_id)
      if (selectedProduct?.has_lot_control) {
        loadAvailableLots(formData.product_id, formData.source_warehouse_id)
      }
    }
  }, [formData.product_id, formData.source_warehouse_id])

  const loadData = async () => {
    if (!currentOrg?.id) return

    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, unit, has_lot_control, has_serial_control')
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

  const loadWarehouseStock = async (productId: string) => {
    try {
      const { data: stockData } = await supabase
        .from('product_warehouse_stock')
        .select(`
          warehouse_id,
          quantity,
          warehouse:warehouses(name)
        `)
        .eq('product_id', productId)
        .gt('quantity', 0)

      const formattedStock: WarehouseStock[] = stockData?.map(item => ({
        warehouse_id: item.warehouse_id,
        warehouse_name: (item.warehouse as any)?.name || 'Armazém',
        quantity: item.quantity
      })) || []

      setWarehouseStock(formattedStock)
    } catch (error) {
      console.error('Error loading warehouse stock:', error)
    }
  }

  const loadAvailableLots = async (productId: string, warehouseId: string) => {
    if (!warehouseId) {
      setAvailableLots([])
      return
    }

    try {
      const { data: lotsData } = await supabase
        .from('product_lots')
        .select('id, lot_number, quantity, expiration_date')
        .eq('product_id', productId)
        .eq('status', 'active')
        .gt('quantity', 0)
        .order('expiration_date')

      setAvailableLots(lotsData || [])
    } catch (error) {
      console.error('Error loading lots:', error)
    }
  }

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId,
      source_warehouse_id: "",
      destination_warehouse_id: "",
      lot_id: ""
    }))
  }

  const getAvailableQuantity = () => {
    if (!formData.source_warehouse_id) return 0
    
    const warehouseStockItem = warehouseStock.find(ws => ws.warehouse_id === formData.source_warehouse_id)
    return warehouseStockItem?.quantity || 0
  }

  const getAvailableDestinationWarehouses = () => {
    return warehouses.filter(w => w.id !== formData.source_warehouse_id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.source_warehouse_id || !formData.destination_warehouse_id || formData.quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (formData.source_warehouse_id === formData.destination_warehouse_id) {
      toast({
        title: "Armazéns iguais",
        description: "O armazém de origem deve ser diferente do destino.",
        variant: "destructive",
      })
      return
    }

    const availableQty = getAvailableQuantity()
    if (formData.quantity > availableQty) {
      toast({
        title: "Quantidade insuficiente",
        description: `Quantidade disponível: ${availableQty}`,
        variant: "destructive",
      })
      return
    }

    // Validate lot control
    if (selectedProduct?.has_lot_control && !formData.lot_id) {
      toast({
        title: "Lote obrigatório",
        description: "Este produto requer seleção de lote.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create outbound movement (source warehouse)
      const { error: outMovementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: formData.product_id,
          warehouse_id: formData.source_warehouse_id,
          movement_type: 'out',
          quantity: formData.quantity,
          lot_id: formData.lot_id || null,
          reference_type: 'transfer_out',
          reference_id: formData.reference_document || null,
          notes: `Transferência para armazém destino - ${formData.transfer_reason} - ${formData.notes}`,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (outMovementError) throw outMovementError

      // Create inbound movement (destination warehouse)
      const { error: inMovementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: formData.product_id,
          warehouse_id: formData.destination_warehouse_id,
          movement_type: 'in',
          quantity: formData.quantity,
          lot_id: formData.lot_id || null,
          reference_type: 'transfer_in',
          reference_id: formData.reference_document || null,
          notes: `Transferência do armazém origem - ${formData.transfer_reason} - ${formData.notes}`,
          org_id: currentOrg?.id,
          created_by: user?.id,
        })

      if (inMovementError) throw inMovementError

      toast({
        title: "Transferência registrada",
        description: "A transferência entre armazéns foi registrada com sucesso.",
      })

      // Reset form
      setFormData({
        product_id: "",
        source_warehouse_id: "",
        destination_warehouse_id: "",
        quantity: 0,
        lot_id: "",
        transfer_reason: "",
        reference_document: "",
        notes: ""
      })
      setSelectedProduct(null)
      setWarehouseStock([])
      setAvailableLots([])
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao registrar transferência",
        description: "Ocorreu um erro ao registrar a transferência de estoque.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          Transferência entre Armazéns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
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

          {/* Warehouse Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source_warehouse">Armazém de Origem *</Label>
              <Select 
                value={formData.source_warehouse_id} 
                onValueChange={(value) => setFormData(prev => ({...prev, source_warehouse_id: value, destination_warehouse_id: ""}))}
                disabled={!formData.product_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o armazém de origem" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseStock.map(stock => (
                    <SelectItem key={stock.warehouse_id} value={stock.warehouse_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{stock.warehouse_name}</span>
                        <Badge variant="outline">{stock.quantity} disponível</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destination_warehouse">Armazém de Destino *</Label>
              <Select 
                value={formData.destination_warehouse_id} 
                onValueChange={(value) => setFormData(prev => ({...prev, destination_warehouse_id: value}))}
                disabled={!formData.source_warehouse_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o armazém de destino" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDestinationWarehouses().map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.location && `- ${warehouse.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={getAvailableQuantity()}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: Number(e.target.value)}))}
                required
              />
              <div className="flex items-center justify-between mt-1">
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Unidade: {selectedProduct.unit}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Disponível: {getAvailableQuantity()}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="transfer_reason">Motivo da Transferência *</Label>
              <Input
                id="transfer_reason"
                value={formData.transfer_reason}
                onChange={(e) => setFormData(prev => ({...prev, transfer_reason: e.target.value}))}
                placeholder="Motivo da transferência"
                required
              />
            </div>
          </div>

          {/* Lot Control */}
          {selectedProduct?.has_lot_control && availableLots.length > 0 && (
            <div>
              <Label htmlFor="lot_id">Lote *</Label>
              <Select value={formData.lot_id} onValueChange={(value) => setFormData(prev => ({...prev, lot_id: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableLots.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{lot.lot_number}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{lot.quantity} disponível</Badge>
                          {lot.expiration_date && (
                            <Badge variant={new Date(lot.expiration_date) < new Date() ? "destructive" : "secondary"}>
                              {new Date(lot.expiration_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warning for insufficient stock */}
          {formData.quantity > getAvailableQuantity() && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">
                Quantidade solicitada ({formData.quantity}) excede o estoque disponível ({getAvailableQuantity()})
              </p>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <Label htmlFor="reference_document">Documento de Referência</Label>
            <Input
              id="reference_document"
              value={formData.reference_document}
              onChange={(e) => setFormData(prev => ({...prev, reference_document: e.target.value}))}
              placeholder="Ordem de transferência, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Observações adicionais sobre a transferência"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button type="submit">
              Realizar Transferência
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}