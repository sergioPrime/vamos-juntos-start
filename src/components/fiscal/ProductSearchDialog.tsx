import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface Product {
  id: string;
  name: string;
  sku?: string;
  ncm?: string;
  sale_price?: number;
  stock_quantity?: number;
}

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product) => void;
}

export default function ProductSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: ProductSearchDialogProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    if (open && currentOrg) {
      loadProducts();
    }
  }, [open, currentOrg]);

  const loadProducts = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("org_id", currentOrg.id)
        .or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
        .limit(20);

      if (error) throw error;

      setProducts(
        data?.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          ncm: p.ncm,
          sale_price: p.sale_price,
          stock_quantity: p.stock_quantity,
        })) || []
      );
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadProducts()}
            />
            <Button onClick={loadProducts} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto encontrado
              </div>
            )}

            {!loading &&
              products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.ncm && <span className="ml-3">NCM: {product.ncm}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {product.sale_price?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      {product.stock_quantity !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          Estoque: {product.stock_quantity}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
