import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  razao_social: string | null;
  documento: string | null;
  email_geral: string | null;
  cidade: string | null;
  uf: string | null;
}

interface CustomerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerSearchDialog({
  open,
  onOpenChange,
  onSelectCustomer,
}: CustomerSearchDialogProps) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("pessoas")
        .select("id, razao_social, documento, email_geral, cidade, uf")
        .eq("tipo", "cliente");

      if (search) {
        query = query.or(`razao_social.ilike.%${search}%,documento.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setCustomers((data as any[]) || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao buscar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      searchCustomers();
    }
  }, [open]);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 pb-4">
          <Input
            placeholder="Buscar por nome ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCustomers()}
          />
          <Button onClick={searchCustomers} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(customer)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{customer.razao_social}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.documento}
                      </p>
                      {customer.cidade && customer.uf && (
                        <p className="text-sm text-muted-foreground">
                          {customer.cidade} - {customer.uf}
                        </p>
                      )}
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
