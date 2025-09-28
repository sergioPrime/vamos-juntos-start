import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnManager } from "@/components/finance/ColumnManager";

interface SalesCategory {
  id: string;
  name: string;
  moves_stock: boolean;
  moves_financial: boolean;
  visible_in_fiscal_operations: boolean;
  is_active: boolean;
  created_at: string;
}

const SalesCategories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    moves_stock: true,
    moves_financial: true,
    visible_in_fiscal_operations: true,
    actions: true,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['sales-categories', currentOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_categories')
        .select('*')
        .eq('org_id', currentOrg?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-categories'] });
      toast.success("Categoria removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover categoria");
    },
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta categoria?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { key: 'name', label: 'Nome', visible: true },
    { key: 'moves_stock', label: 'Movimenta Estoque', visible: true },
    { key: 'moves_financial', label: 'Movimenta Financeiro', visible: true },
    { key: 'visible_in_fiscal_operations', label: 'Visível nas Op. Fiscais', visible: true },
    { key: 'actions', label: 'Ações', visible: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias de Vendas</h1>
          <p className="text-muted-foreground">Gerencie as categorias de vendas</p>
        </div>
        <Button onClick={() => navigate('/cadastros/categorias-vendas/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={(updatedColumns) => {
              const newVisibility = updatedColumns.reduce((acc, col) => ({
                ...acc,
                [col.key]: col.visible
              }), {} as typeof visibleColumns);
              setVisibleColumns(newVisibility);
            }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {visibleColumns.name && (
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                )}
                {visibleColumns.moves_stock && (
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Movimenta Estoque</th>
                )}
                {visibleColumns.moves_financial && (
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Movimenta Financeiro</th>
                )}
                {visibleColumns.visible_in_fiscal_operations && (
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Visível nas Op. Fiscais</th>
                )}
                {visibleColumns.actions && (
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Carregando...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-muted/50">
                    {visibleColumns.name && (
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                    )}
                    {visibleColumns.moves_stock && (
                      <td className="py-3 px-4 text-center">
                        {category.moves_stock ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    )}
                    {visibleColumns.moves_financial && (
                      <td className="py-3 px-4 text-center">
                        {category.moves_financial ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    )}
                    {visibleColumns.visible_in_fiscal_operations && (
                      <td className="py-3 px-4 text-center">
                        {category.visible_in_fiscal_operations ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/cadastros/categorias-vendas/${category.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SalesCategories;