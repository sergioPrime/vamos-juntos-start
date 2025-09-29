import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, MoreHorizontal, Calculator } from "lucide-react";
import { PriceTableProductsManager } from "@/components/price-tables/PriceTableProductsManager";

interface PriceTableFormData {
  id?: string;
  name: string;
  gender: string;
  visible_in_pdv: boolean;
  auto_update_cost_changes: boolean;
  auto_update_commission_changes: boolean;
  default_seller_commission: number;
  default_representative_commission: number;
  default_mva: number;
}

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

const genderOptions = [
  { value: "00", label: "00 - Mercadoria para Revenda" },
  { value: "01", label: "01 - Serviço" },
  { value: "02", label: "02 - Matéria Prima" },
  { value: "03", label: "03 - Produto Acabado" },
  { value: "04", label: "04 - Produto em Processo" },
];

export default function PriceTablesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PriceTableFormData>({
    name: "",
    gender: "",
    visible_in_pdv: true,
    auto_update_cost_changes: false,
    auto_update_commission_changes: false,
    default_seller_commission: 0,
    default_representative_commission: 0,
    default_mva: 0,
  });

  const [products, setProducts] = useState<PriceTableProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dados");

  useEffect(() => {
    if (id && id !== "novo") {
      loadPriceTable();
      loadPriceTableProducts();
    }
    loadAvailableProducts();
  }, [id, currentOrg?.id]);

  const loadPriceTable = async () => {
    if (!id || id === "novo") return;

    try {
      const { data, error } = await supabase
        .from("price_tables")
        .select("*")
        .eq("id", id)
        .eq("org_id", currentOrg?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar tabela:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tabela de preços",
        variant: "destructive",
      });
    }
  };

  const loadPriceTableProducts = async () => {
    if (!id || id === "novo") return;

    try {
      // Buscar produtos da tabela de preços
      const { data: priceTableProducts, error: priceTableError } = await supabase
        .from("price_table_products")
        .select("*")
        .eq("price_table_id", id);

      if (priceTableError) throw priceTableError;

      if (!priceTableProducts || priceTableProducts.length === 0) {
        setProducts([]);
        return;
      }

      // Buscar informações dos produtos
      const productIds = priceTableProducts.map(ptp => ptp.product_id);
      const { data: productsInfo, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, cost_price")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Combinar os dados
      const combinedData = priceTableProducts.map(ptp => ({
        ...ptp,
        products: productsInfo?.find(p => p.id === ptp.product_id) || null
      }));

      setProducts(combinedData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const loadAvailableProducts = async () => {
    if (!currentOrg?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, cost_price")
        .eq("org_id", currentOrg?.id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos disponíveis:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gender) {
      toast({
        title: "Erro",
        description: "Gênero é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (id && id !== "novo") {
        // Atualizar
        const { error } = await supabase
          .from("price_tables")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tabela de preços atualizada com sucesso",
        });
      } else {
        // Criar nova
        const { error } = await supabase.from("price_tables").insert({
          ...formData,
          org_id: currentOrg?.id,
          created_by: user?.id,
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tabela de preços criada com sucesso",
        });
      }

      navigate("/cadastros/tabela-precos");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Nome da tabela já existe",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar tabela de preços",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDefaultRules = async () => {
    if (!id || id === "novo") return;

    try {
      const { error } = await supabase
        .from("price_table_products")
        .update({
          seller_commission: formData.default_seller_commission,
          representative_commission: formData.default_representative_commission,
          mva: formData.default_mva,
        })
        .eq("price_table_id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regras padrão aplicadas com sucesso",
      });

      loadPriceTableProducts();
    } catch (error) {
      console.error("Erro ao aplicar regras:", error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar regras padrão",
        variant: "destructive",
      });
    }
  };

  const handleAddProducts = async (productIds: string[]) => {
    if (productIds.length === 0) return;

    try {
      // Verificar duplicatas
      const { data: existingProducts } = await supabase
        .from("price_table_products")
        .select("product_id")
        .eq("price_table_id", id)
        .in("product_id", productIds);

      const existingIds = existingProducts?.map(p => p.product_id) || [];
      const newProductIds = productIds.filter(id => !existingIds.includes(id));

      if (newProductIds.length === 0) {
        toast({
          title: "Aviso",
          description: "Todos os produtos selecionados já estão na tabela",
          variant: "destructive",
        });
        return;
      }

      const newProducts = newProductIds.map((productId) => ({
        price_table_id: id,
        product_id: productId,
        sale_price: 0,
        seller_commission: formData.default_seller_commission,
        representative_commission: formData.default_representative_commission,
        mva: formData.default_mva,
      }));

      const { error } = await supabase
        .from("price_table_products")
        .insert(newProducts);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${newProductIds.length} produto(s) adicionado(s) com sucesso`,
      });

      loadPriceTableProducts();
    } catch (error) {
      console.error("Erro ao adicionar produtos:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar produtos",
        variant: "destructive",
      });
    }
  };

  const handleRemoveProduct = async (productTableId: string) => {
    try {
      const { error } = await supabase
        .from("price_table_products")
        .delete()
        .eq("id", productTableId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso",
      });

      loadPriceTableProducts();
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover produto",
        variant: "destructive",
      });
    }
  };

  const updateProductField = async (productTableId: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from("price_table_products")
        .update({ [field]: value })
        .eq("id", productTableId);

      if (error) throw error;

      // Atualizar estado local
      setProducts(prev => prev.map(p => 
        p.id === productTableId 
          ? { ...p, [field]: value }
          : p
      ));
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto",
        variant: "destructive",
      });
    }
  };

  if (!currentOrg) {
    return <div className="p-6">Selecione uma organização para continuar.</div>;
  }

  const isEditing = id && id !== "novo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/cadastros/tabela-precos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Editar Tabela de Preços" : "Nova Tabela de Preços"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Mais Ações
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="produtos" disabled={!isEditing}>
                Produtos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Tabela *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Tabela Varejo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visible_pdv">Visível no PDV</Label>
                    <p className="text-sm text-muted-foreground">
                      Esta tabela aparecerá no Ponto de Venda
                    </p>
                  </div>
                  <Switch
                    id="visible_pdv"
                    checked={formData.visible_in_pdv}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible_in_pdv: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_cost">Auto Atualização por Custo</Label>
                    <p className="text-sm text-muted-foreground">
                      Atualizar preços automaticamente quando o custo mudar
                    </p>
                  </div>
                  <Switch
                    id="auto_cost"
                    checked={formData.auto_update_cost_changes}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_update_cost_changes: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_commission">Auto Atualização por Comissão</Label>
                    <p className="text-sm text-muted-foreground">
                      Atualizar preços quando as comissões mudarem
                    </p>
                  </div>
                  <Switch
                    id="auto_commission"
                    checked={formData.auto_update_commission_changes}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_update_commission_changes: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Regras Padrão</h3>
                  {isEditing && products.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyDefaultRules}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Aplicar a Todos os Produtos
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller_commission">Comissão Vendedor (%)</Label>
                    <Input
                      id="seller_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_seller_commission}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_seller_commission: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representative_commission">Comissão Representante (%)</Label>
                    <Input
                      id="representative_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_representative_commission}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_representative_commission: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mva">MVA (%)</Label>
                    <Input
                      id="mva"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.01"
                      value={formData.default_mva}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_mva: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="produtos" className="mt-6">
              {isEditing && (
                <PriceTableProductsManager
                  products={products}
                  availableProducts={availableProducts}
                  onAddProducts={handleAddProducts}
                  onRemoveProduct={handleRemoveProduct}
                  onUpdateProduct={updateProductField}
                  onApplyDefaultRules={handleApplyDefaultRules}
                  defaultRules={{
                    seller_commission: formData.default_seller_commission,
                    representative_commission: formData.default_representative_commission,
                    mva: formData.default_mva,
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}