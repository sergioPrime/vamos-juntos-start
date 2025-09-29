import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, DollarSign, Percent, Trash2, Calculator } from "lucide-react";
import { ProductSearchModal } from "./ProductSearchModal";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveTable } from "@/components/ui/responsive-table";

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
}

interface PriceTableProduct {
  id: string;
  product_id: string;
  sale_price: number;
  seller_commission: number;
  representative_commission: number;
  mva: number;
  products?: Product;
}

interface PriceTableProductsManagerProps {
  products: PriceTableProduct[];
  availableProducts: Product[];
  onAddProducts: (productIds: string[]) => Promise<void>;
  onRemoveProduct: (productTableId: string) => Promise<void>;
  onUpdateProduct: (productTableId: string, field: string, value: number) => Promise<void>;
  onApplyDefaultRules: () => Promise<void>;
  defaultRules: {
    seller_commission: number;
    representative_commission: number;
    mva: number;
  };
}

export function PriceTableProductsManager({
  products,
  availableProducts,
  onAddProducts,
  onRemoveProduct,
  onUpdateProduct,
  onApplyDefaultRules,
  defaultRules
}: PriceTableProductsManagerProps) {
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Filtrar produtos com base na busca
  const filteredProducts = products.filter(product =>
    product.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.products?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Produtos já adicionados (para excluir do modal)
  const addedProductIds = products.map(p => p.product_id);

  // Calcular margem de lucro
  const calculateMargin = useCallback((salePrice: number, costPrice: number) => {
    if (costPrice <= 0 || salePrice <= 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }, []);

  // Calcular preço sugerido baseado na margem
  const calculateSuggestedPrice = useCallback((costPrice: number, targetMargin: number = 30) => {
    if (costPrice <= 0) return 0;
    return costPrice * (1 + targetMargin / 100);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleFieldUpdate = async (productTableId: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    // Validações
    if (field.includes('commission') && (numValue < 0 || numValue > 100)) {
      toast({
        title: "Valor inválido",
        description: "Comissões devem estar entre 0% e 100%",
        variant: "destructive"
      });
      return;
    }

    if (field === 'mva' && (numValue < 0 || numValue > 1000)) {
      toast({
        title: "Valor inválido",
        description: "MVA deve estar entre 0% e 1000%",
        variant: "destructive"
      });
      return;
    }

    if (field === 'sale_price' && numValue < 0) {
      toast({
        title: "Valor inválido",
        description: "Preço de venda não pode ser negativo",
        variant: "destructive"
      });
      return;
    }

    await onUpdateProduct(productTableId, field, numValue);
  };

  const handleApplySuggestedPrice = async (productTableId: string, costPrice: number) => {
    const suggestedPrice = calculateSuggestedPrice(costPrice);
    await onUpdateProduct(productTableId, 'sale_price', suggestedPrice);
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos da Tabela ({products.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos e preços desta tabela
          </p>
        </div>
        <div className="flex gap-2">
          {products.length > 0 && (
            <Button
              variant="outline"
              onClick={onApplyDefaultRules}
              size="sm"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Aplicar Regras Padrão
            </Button>
          )}
          <Button
            onClick={() => setShowProductModal(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produtos
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto adicionado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando produtos a esta tabela de preços
              </p>
              <Button onClick={() => setShowProductModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="text-base">Lista de Produtos</CardTitle>
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-4"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveTable>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Produto</th>
                    <th className="text-right p-3 font-medium">Preço Custo</th>
                    <th className="text-right p-3 font-medium">Preço Venda</th>
                    <th className="text-right p-3 font-medium">Margem</th>
                    <th className="text-right p-3 font-medium">Com. Vendedor</th>
                    <th className="text-right p-3 font-medium">Com. Representante</th>
                    <th className="text-right p-3 font-medium">MVA</th>
                    <th className="text-center p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const margin = calculateMargin(product.sale_price, product.products?.cost_price || 0);
                    const suggestedPrice = calculateSuggestedPrice(product.products?.cost_price || 0);
                    
                    return (
                      <tr key={product.id} className="border-b hover:bg-accent/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{product.products?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {product.products?.sku}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {formatCurrency(product.products?.cost_price || 0)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.sale_price}
                              onChange={(e) => handleFieldUpdate(product.id, 'sale_price', e.target.value)}
                              className="w-28 text-right text-sm"
                            />
                            {product.sale_price !== suggestedPrice && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApplySuggestedPrice(product.id, product.products?.cost_price || 0)}
                                className="h-6 text-xs p-1"
                              >
                                Sugerir: {formatCurrency(suggestedPrice)}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <Badge 
                            variant={margin < 10 ? "destructive" : margin < 20 ? "secondary" : "default"}
                            className="font-mono"
                          >
                            <Percent className="h-3 w-3 mr-1" />
                            {formatPercent(margin)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={product.seller_commission}
                            onChange={(e) => handleFieldUpdate(product.id, 'seller_commission', e.target.value)}
                            className="w-20 text-right text-sm"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={product.representative_commission}
                            onChange={(e) => handleFieldUpdate(product.id, 'representative_commission', e.target.value)}
                            className="w-20 text-right text-sm"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1000"
                            value={product.mva}
                            onChange={(e) => handleFieldUpdate(product.id, 'mva', e.target.value)}
                            className="w-20 text-right text-sm"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveProduct(product.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTable>
          </CardContent>
        </Card>
      )}

      {/* Modal de Busca de Produtos */}
      <ProductSearchModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={availableProducts}
        onAddProducts={onAddProducts}
        excludeProductIds={addedProductIds}
      />
    </div>
  );
}