import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface SalesCategoryFormData {
  name: string;
  moves_stock: boolean;
  moves_financial: boolean;
  visible_in_fiscal_operations: boolean;
}

const SalesCategoriesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const isEdit = !!id;

  const [formData, setFormData] = useState<SalesCategoryFormData>({
    name: "",
    moves_stock: false,
    moves_financial: false,
    visible_in_fiscal_operations: false,
  });

  const { data: category } = useQuery({
    queryKey: ['sales-category', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        moves_stock: category.moves_stock,
        moves_financial: category.moves_financial,
        visible_in_fiscal_operations: category.visible_in_fiscal_operations,
      });
    }
  }, [category]);

  const saveMutation = useMutation({
    mutationFn: async (data: SalesCategoryFormData) => {
      if (isEdit) {
        const { error } = await supabase
          .from('sales_categories')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales_categories')
          .insert({
            ...data,
            org_id: currentOrg?.id,
            created_by: user?.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Categoria ${isEdit ? 'atualizada' : 'criada'} com sucesso!`);
      navigate('/cadastros/categorias-vendas');
    },
    onError: (error) => {
      console.error('Error saving category:', error);
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} categoria`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof SalesCategoryFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite os dados da categoria de vendas' : 'Cadastre uma nova categoria de vendas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cadastros/categorias-vendas')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome da categoria"
              required
              uppercase
              blockSpecialChars
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="moves_stock">Movimenta Estoque</Label>
                <p className="text-sm text-muted-foreground">
                  Define se a categoria movimenta estoque
                </p>
              </div>
              <Switch
                id="moves_stock"
                checked={formData.moves_stock}
                onCheckedChange={(checked) => handleInputChange('moves_stock', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="moves_financial">Movimenta Financeiro</Label>
                <p className="text-sm text-muted-foreground">
                  Define se a categoria movimenta financeiro
                </p>
              </div>
              <Switch
                id="moves_financial"
                checked={formData.moves_financial}
                onCheckedChange={(checked) => handleInputChange('moves_financial', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="visible_in_fiscal_operations">Visível nas Operações Fiscais</Label>
                <p className="text-sm text-muted-foreground">
                  Define se a categoria é visível nas operações fiscais
                </p>
              </div>
              <Switch
                id="visible_in_fiscal_operations"
                checked={formData.visible_in_fiscal_operations}
                onCheckedChange={(checked) => handleInputChange('visible_in_fiscal_operations', checked)}
              />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SalesCategoriesForm;