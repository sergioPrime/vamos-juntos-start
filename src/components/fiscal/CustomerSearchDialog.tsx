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

interface Customer {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface CustomerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: any) => void;
}

export default function CustomerSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: CustomerSearchDialogProps) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    if (open && currentOrg) {
      loadCustomers();
    }
  }, [open, currentOrg]);

  const loadCustomers = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      // @ts-ignore - Supabase types complexity
      const { data, error } = await supabase
        .from("pessoas")
        .select("*")
        .eq("org_id", currentOrg.id)
        .eq("tipo", "cliente")
        .or(`nome.ilike.%${search}%,documento.ilike.%${search}%`)
        .limit(20);

      if (error) throw error;

      setCustomers(
        data?.map((p: any) => ({
          id: p.id,
          name: p.nome,
          document: p.documento,
          email: p.email,
          phone: p.telefone,
          address: p.endereco,
          city: p.cidade,
          state: p.estado,
          zip_code: p.cep,
        })) || []
      );
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
            />
            <Button onClick={loadCustomers} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}

            {!loading && customers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            )}

            {!loading &&
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onSelect(customer)}
                >
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.document && <span>{customer.document}</span>}
                    {customer.email && <span className="ml-3">{customer.email}</span>}
                  </div>
                  {customer.address && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {customer.address}
                      {customer.city && ` - ${customer.city}`}
                      {customer.state && `/${customer.state}`}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
