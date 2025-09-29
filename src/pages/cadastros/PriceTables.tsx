import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PriceTableCard } from "@/components/price-tables/PriceTableCard";
import { PriceTableFilters } from "@/components/price-tables/PriceTableFilters";

interface PriceTable {
  id: string;
  name: string;
  gender: string;
  visible_in_pdv: boolean;
  default_seller_commission: number;
  default_representative_commission: number;
  default_mva: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

interface FilterState {
  search: string;
  gender: string;
  pdv_visibility: string;
  has_rules: string;
}

export default function PriceTables() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    gender: "",
    pdv_visibility: "",
    has_rules: ""
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (currentOrg?.id) {
      loadPriceTables();
    }
  }, [currentOrg?.id]);

  const loadPriceTables = async () => {
    try {
      setLoading(true);
      
      // Carregar tabelas com contagem de produtos
      const { data: tables, error: tablesError } = await supabase
        .from("price_tables")
        .select("*")
        .eq("org_id", currentOrg?.id)
        .eq("is_active", true)
        .order("name");

      if (tablesError) throw tablesError;

      // Carregar contagem de produtos para cada tabela
      const tablesWithCount = await Promise.all(
        (tables || []).map(async (table) => {
          const { count } = await supabase
            .from("price_table_products")
            .select("*", { count: "exact", head: true })
            .eq("price_table_id", table.id);
          
          return {
            ...table,
            product_count: count || 0
          };
        })
      );

      setPriceTables(tablesWithCount);
    } catch (error) {
      console.error("Erro ao carregar tabelas de preços:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tabelas de preços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      // Verificar se há produtos vinculados
      const { count } = await supabase
        .from("price_table_products")
        .select("*", { count: "exact", head: true })
        .eq("price_table_id", id);

      if (count && count > 0) {
        toast({
          title: "Não é possível excluir",
          description: `Esta tabela possui ${count} produto(s) vinculado(s). Remova os produtos antes de excluir.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("price_tables")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tabela de preços excluída com sucesso",
      });

      setShowDeleteDialog(null);
      loadPriceTables();
    } catch (error) {
      console.error("Erro ao excluir tabela de preços:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tabela de preços",
        variant: "destructive",
      });
    }
  };

  // Aplicar filtros nas tabelas
  const filteredTables = useMemo(() => {
    return priceTables.filter(table => {
      // Filtro por busca
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!table.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por gênero
      if (filters.gender && table.gender !== filters.gender) {
        return false;
      }

      // Filtro por visibilidade no PDV
      if (filters.pdv_visibility) {
        const isVisible = filters.pdv_visibility === "true";
        if (table.visible_in_pdv !== isVisible) {
          return false;
        }
      }

      // Filtro por regras configuradas
      if (filters.has_rules) {
        const hasRules = 
          table.default_seller_commission > 0 ||
          table.default_representative_commission > 0 ||
          table.default_mva > 0;
        const shouldHaveRules = filters.has_rules === "true";
        if (hasRules !== shouldHaveRules) {
          return false;
        }
      }

      return true;
    });
  }, [priceTables, filters]);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      gender: "",
      pdv_visibility: "",
      has_rules: ""
    });
  };

  if (!currentOrg) {
    return (
      <div className="p-6">
        <p>Selecione uma organização para continuar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Tabela de Preços</h1>
          <p className="text-muted-foreground">
            Gerencie as tabelas de preços da sua organização
          </p>
        </div>
        <Button onClick={() => navigate("/cadastros/tabela-precos/novo")} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nova Tabela
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTableFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            totalResults={filteredTables.length}
          />
        </CardContent>
      </Card>

      {/* Lista de Tabelas */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-48 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
              <p className="mt-4 text-muted-foreground">Carregando tabelas...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredTables.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2">
                {priceTables.length === 0 ? "Nenhuma tabela criada" : "Nenhuma tabela encontrada"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {priceTables.length === 0 
                  ? "Comece criando sua primeira tabela de preços"
                  : "Tente ajustar os filtros para encontrar a tabela desejada"
                }
              </p>
              {priceTables.length === 0 && (
                <Button onClick={() => navigate("/cadastros/tabela-precos/novo")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Tabela
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((table) => (
            <PriceTableCard
              key={table.id}
              table={table}
              onDelete={(id, name) => setShowDeleteDialog({ id, name })}
            />
          ))}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tabela de Preços</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tabela "{showDeleteDialog?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog.id, showDeleteDialog.name)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}