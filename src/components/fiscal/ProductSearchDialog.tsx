import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  unit_price: number | null;
  ncm: string | null;
}

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onSelectProduct,
}: ProductSearchDialogProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, name, sku, unit, unit_price, ncm")
        .eq("active", true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao buscar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      searchProducts();
    }
  }, [open]);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Produto</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 pb-4">
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchProducts()}
          />
          <Button onClick={searchProducts} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku || "N/A"}
                      </p>
                      {product.ncm && (
                        <p className="text-sm text-muted-foreground">
                          NCM: {product.ncm}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        R$ {product.unit_price?.toFixed(2) || "0,00"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.unit || "UN"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
