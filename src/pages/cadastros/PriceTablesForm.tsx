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
import { ArrowLeft, Save, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  product?: Product;
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
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    order: "name",
  });
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
      const { data, error } = await supabase
        .from("price_table_products")
        .select(`
          *,
          products (
            id,
            name,
            sku,
            cost_price
          )
        `)
        .eq("price_table_id", id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const loadAvailableProducts = async () => {
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

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const newProducts = selectedProducts.map((productId) => ({
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
        description: `${selectedProducts.length} produto(s) adicionado(s) com sucesso`,
      });

      setSelectedProducts([]);
      setShowProductModal(false);
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

  const handleRemoveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("price_table_products")
        .delete()
        .eq("id", productId);

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

  const handleSearchProducts = () => {
    let filtered = [...availableProducts];
    
    // Se não há filtros aplicados, mostra todos os produtos disponíveis
    const hasFilters = searchFilters.name || searchFilters.category || searchFilters.brand || searchFilters.model;
    
    if (hasFilters) {
      filtered = availableProducts.filter(product => {
        const matchesName = !searchFilters.name || 
          product.name?.toLowerCase().includes(searchFilters.name.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchFilters.name.toLowerCase());
        
        // Por enquanto, apenas filtro por nome/código está funcional
        // Os outros filtros podem ser implementados quando as colunas estiverem disponíveis na tabela products
        return matchesName;
      });
    }
    
    // Ordenar resultados
    filtered.sort((a, b) => {
      switch (searchFilters.order) {
        case "sku":
          return (a.sku || "").localeCompare(b.sku || "");
        case "cost_price":
          return (a.cost_price || 0) - (b.cost_price || 0);
        case "sale_price":
          return 0; // Produtos não têm preço de venda até serem adicionados à tabela
        default: // name
          return (a.name || "").localeCompare(b.name || "");
      }
    });
    
    setFilteredProducts(filtered);
    setHasSearched(true);
  };

  const handleClearFilters = () => {
    setSearchFilters({ name: "", category: "", brand: "", model: "", order: "name" });
    setFilteredProducts([]);
    setHasSearched(false);
  };

  const addProductToTable = async (product: Product) => {
    if (!currentOrg?.id || !id || id === "novo") return;

    try {
      const newPriceTableProduct = {
        price_table_id: id,
        product_id: product.id,
        sale_price: 0,
        seller_commission: formData.default_seller_commission || 0,
        representative_commission: formData.default_representative_commission || 0,
        mva: formData.default_mva || 0,
      };

      const { data, error } = await supabase
        .from("price_table_products")
        .insert(newPriceTableProduct)
        .single();

      if (error) throw error;

      // Recarregar a lista de produtos da tabela
      await loadPriceTableProducts();
      
      toast({
        title: "Produto adicionado",
        description: "Produto adicionado à tabela com sucesso",
      });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto à tabela",
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
          <Button variant="outline" onClick={() => navigate("/cadastros/tabela-precos")}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="dados" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Dados
              </TabsTrigger>
              {isEditing && (
                <TabsTrigger 
                  value="produtos" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Produtos
                </TabsTrigger>
              )}
            </TabsList>

            {/* Aba Dados */}
            <TabsContent value="dados" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: PROMOCOES, ATACADO, VAREJO"
                    maxLength={100}
                  />
                </div>

                {/* Gênero */}
                <div className="space-y-2">
                  <Label>Gênero *</Label>
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

              {/* Switches */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="visible_pdv"
                    checked={formData.visible_in_pdv}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible_in_pdv: checked }))}
                  />
                  <Label htmlFor="visible_pdv">Visível no PDV?</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_cost"
                    checked={formData.auto_update_cost_changes}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_update_cost_changes: checked }))}
                  />
                  <Label htmlFor="auto_cost">Atualizar Preços ao alterar custo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_commission"
                    checked={formData.auto_update_commission_changes}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_update_commission_changes: checked }))}
                  />
                  <Label htmlFor="auto_commission">Atualizar Preços ao alterar Comissão</Label>
                </div>
              </div>

              {/* Regras Padrão */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Regras Padrão</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller_commission">Comissão Vendedor Padrão %</Label>
                    <Input
                      id="seller_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_seller_commission}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        default_seller_commission: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representative_commission">Comissão Representante Padrão %</Label>
                    <Input
                      id="representative_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_representative_commission}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        default_representative_commission: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mva">Padrão MVA %</Label>
                    <Input
                      id="mva"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_mva}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        default_mva: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <Button onClick={handleApplyDefaultRules}>
                      Aplicar Regras Padrão
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba Produtos */}
            {isEditing && (
              <TabsContent value="produtos" className="p-6 space-y-6">
                {/* Busca Avançada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Busca Avançada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Input
                        placeholder="Nome/Código do Produto"
                        value={searchFilters.name}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Categoria"
                        value={searchFilters.category}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                      />
                      <Input
                        placeholder="Marca"
                        value={searchFilters.brand}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, brand: e.target.value }))}
                      />
                      <Input
                        placeholder="Modelo"
                        value={searchFilters.model}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, model: e.target.value }))}
                      />
                      <Select value={searchFilters.order} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, order: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nome</SelectItem>
                          <SelectItem value="sku">Código</SelectItem>
                          <SelectItem value="cost_price">Preço Custo</SelectItem>
                          <SelectItem value="sale_price">Preço Venda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={handleSearchProducts}>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar
                      </Button>
                      <Button variant="outline" onClick={handleClearFilters}>
                        Limpar Filtros
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Botão Adicionar e Lista de Produtos */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Produtos Associados</h3>
                  <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Produto(s)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Adicionar Produtos</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="p-2 text-left">
                                  <Checkbox 
                                    checked={selectedProducts.length === availableProducts.filter(p => !products.some(ep => ep.product_id === p.id)).length}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedProducts(availableProducts.filter(p => !products.some(ep => ep.product_id === p.id)).map(p => p.id));
                                      } else {
                                        setSelectedProducts([]);
                                      }
                                    }}
                                  />
                                </th>
                                <th className="p-2 text-left">Código</th>
                                <th className="p-2 text-left">Nome</th>
                                <th className="p-2 text-left">Preço Custo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableProducts
                                .filter(product => !products.some(ep => ep.product_id === product.id))
                                .map((product) => (
                                <tr key={product.id} className="border-b">
                                  <td className="p-2">
                                    <Checkbox 
                                      checked={selectedProducts.includes(product.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedProducts(prev => [...prev, product.id]);
                                        } else {
                                          setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="p-2">{product.sku}</td>
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2">R$ {product.cost_price?.toFixed(2) || "0,00"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowProductModal(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddProducts} disabled={selectedProducts.length === 0}>
                            Adicionar Selecionados ({selectedProducts.length})
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Tabela de Produtos */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2 text-left">Código</th>
                            <th className="p-2 text-left">Nome</th>
                            <th className="p-2 text-right">Preço Custo</th>
                            <th className="p-2 text-right">Despesas</th>
                            <th className="p-2 text-right">Preço Venda</th>
                            <th className="p-2 text-right">Comissão Vendedor (%)</th>
                            <th className="p-2 text-right">Comissão Representação (%)</th>
                            <th className="p-2 text-right">MVA (%)</th>
                            <th className="p-2 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Produtos já associados à tabela */}
                          {products.map((product) => (
                            <tr key={product.id} className="border-b">
                              <td className="p-2">{product.product?.sku}</td>
                              <td className="p-2">{product.product?.name}</td>
                              <td className="p-2 text-right">R$ {product.product?.cost_price?.toFixed(2) || "0,00"}</td>
                              <td className="p-2 text-right">R$ 0,00</td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={product.sale_price}
                                  onChange={(e) => updateProductField(product.id, "sale_price", parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={product.seller_commission}
                                  onChange={(e) => updateProductField(product.id, "seller_commission", parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={product.representative_commission}
                                  onChange={(e) => updateProductField(product.id, "representative_commission", parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={product.mva}
                                  onChange={(e) => updateProductField(product.id, "mva", parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                           ))}
                          
                          {/* Seção de produtos encontrados na busca */}
                          {hasSearched && (
                            <>
                              <tr>
                                <td colSpan={9} className="p-4 bg-muted">
                                  <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span className="font-medium">Produtos Encontrados ({filteredProducts.length})</span>
                                  </div>
                                </td>
                              </tr>
                              {filteredProducts.map((product) => {
                                const isAlreadyAdded = products.some(p => p.product_id === product.id);
                                return (
                                  <tr key={`search-${product.id}`} className="border-b bg-blue-50">
                                    <td className="p-2">{product.sku}</td>
                                    <td className="p-2">{product.name}</td>
                                    <td className="p-2 text-right">R$ {product.cost_price?.toFixed(2) || "0,00"}</td>
                                    <td className="p-2 text-right">R$ 0,00</td>
                                    <td className="p-2 text-center" colSpan={4}>
                                      {isAlreadyAdded ? (
                                        <span className="text-sm text-muted-foreground">Já adicionado à tabela</span>
                                      ) : (
                                        <Button 
                                          size="sm" 
                                          onClick={() => addProductToTable(product)}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Adicionar à Tabela
                                        </Button>
                                      )}
                                    </td>
                                    <td className="p-2"></td>
                                  </tr>
                                );
                              })}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {products.length === 0 && !hasSearched && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto associado a esta tabela
                      </div>
                    )}
                    {hasSearched && filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado com os filtros aplicados
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}