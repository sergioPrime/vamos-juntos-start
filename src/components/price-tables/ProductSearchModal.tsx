import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Package, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  category?: string;
  brand?: string;
}

interface ProductSearchModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onAddProducts: (productIds: string[]) => void;
  excludeProductIds?: string[];
}

export function ProductSearchModal({
  open,
  onClose,
  products,
  onAddProducts,
  excludeProductIds = []
}: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "sku" | "cost_price">("name");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Resetar estado quando modal abre/fecha
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedProducts([]);
      setSortBy("name");
      setCategoryFilter("");
    }
  }, [open]);

  // Filtrar produtos disponíveis (excluindo os já adicionados)
  const availableProducts = useMemo(() => {
    return products.filter(product => !excludeProductIds.includes(product.id));
  }, [products, excludeProductIds]);

  // Produtos filtrados e ordenados
  const filteredProducts = useMemo(() => {
    let filtered = availableProducts;

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoria (se implementado)
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "sku":
          return a.sku.localeCompare(b.sku);
        case "cost_price":
          return (a.cost_price || 0) - (b.cost_price || 0);
        default: // name
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [availableProducts, searchTerm, categoryFilter, sortBy]);

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddSelected = () => {
    if (selectedProducts.length > 0) {
      onAddProducts(selectedProducts);
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adicionar Produtos à Tabela
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Filtros e Busca */}
          <div className="space-y-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="cost_price">Preço de Custo</SelectItem>
                </SelectContent>
              </Select>

              {filteredProducts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  size="sm"
                >
                  {selectedProducts.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              )}
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full border rounded-md">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm || categoryFilter ? (
                    <div>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum produto encontrado com os filtros aplicados</p>
                    </div>
                  ) : (
                    <div>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Todos os produtos já foram adicionados à tabela</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer border border-transparent hover:border-border"
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                SKU: {product.sku}
                              </Badge>
                              {product.cost_price > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatPrice(product.cost_price)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Rodapé com ações - Fixo na parte inferior */}
          <div className="flex-shrink-0 bg-background border-t pt-4 pb-2">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedProducts.length} produto{selectedProducts.length !== 1 ? 's' : ''} selecionado{selectedProducts.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} size="lg">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddSelected}
                  disabled={selectedProducts.length === 0}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar Produtos {selectedProducts.length > 0 && `(${selectedProducts.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}