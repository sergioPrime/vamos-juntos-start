import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComboboxAsync } from "@/components/ui/combobox-async";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface NFeProduct {
  id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  icms_aliquota: number;
  icms_valor: number;
  ipi_aliquota: number;
  ipi_valor: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_aliquota: number;
  cofins_valor: number;
}

interface NFeProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: NFeProduct) => void;
  product?: NFeProduct | null;
}

export default function NFeProductDialog({
  open,
  onOpenChange,
  onSave,
  product,
}: NFeProductDialogProps) {
  const { currentOrg } = useOrganization();
  const [formData, setFormData] = useState<NFeProduct>({
    id: "",
    codigo: "",
    descricao: "",
    ncm: "",
    cfop: "5102",
    unidade: "UN",
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    icms_aliquota: 18,
    icms_valor: 0,
    ipi_aliquota: 0,
    ipi_valor: 0,
    pis_aliquota: 1.65,
    pis_valor: 0,
    cofins_aliquota: 7.6,
    cofins_valor: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        codigo: "",
        descricao: "",
        ncm: "",
        cfop: "5102",
        unidade: "UN",
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        icms_aliquota: 18,
        icms_valor: 0,
        ipi_aliquota: 0,
        ipi_valor: 0,
        pis_aliquota: 1.65,
        pis_valor: 0,
        cofins_aliquota: 7.6,
        cofins_valor: 0,
      });
    }
  }, [product, open]);

  const calculateTotals = (data: Partial<NFeProduct>) => {
    const quantidade = data.quantidade || formData.quantidade;
    const valor_unitario = data.valor_unitario || formData.valor_unitario;
    const valor_total = quantidade * valor_unitario;

    const icms_aliquota = data.icms_aliquota ?? formData.icms_aliquota;
    const ipi_aliquota = data.ipi_aliquota ?? formData.ipi_aliquota;
    const pis_aliquota = data.pis_aliquota ?? formData.pis_aliquota;
    const cofins_aliquota = data.cofins_aliquota ?? formData.cofins_aliquota;

    const icms_valor = (valor_total * icms_aliquota) / 100;
    const ipi_valor = (valor_total * ipi_aliquota) / 100;
    const pis_valor = (valor_total * pis_aliquota) / 100;
    const cofins_valor = (valor_total * cofins_aliquota) / 100;

    return {
      valor_total,
      icms_valor,
      ipi_valor,
      pis_valor,
      cofins_valor,
    };
  };

  const handleInputChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    const calculated = calculateTotals(newData);
    setFormData({ ...newData, ...calculated });
  };

  // Buscar produtos
  const searchProdutos = async (query: string) => {
    if (!currentOrg) return [];

    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, price")
      .eq("org_id", currentOrg.id)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return [];
    }

    return (
      data?.map((prod) => ({
        id: prod.id,
        name: `${prod.name} ${prod.sku ? `- ${prod.sku}` : ""}`,
        code: prod.sku || "",
      })) || []
    );
  };

  // Carregar dados do produto selecionado
  const handleProdutoChange = async (produtoId: string) => {
    if (!produtoId) {
      setFormData((prev) => ({
        ...prev,
        id: "",
        codigo: "",
        descricao: "",
      }));
      return;
    }

    const { data: produto, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", produtoId)
      .single();

    if (error) {
      toast.error("Erro ao carregar dados do produto");
      return;
    }

    const newData = {
      ...formData,
      id: produto.id,
      codigo: produto.sku || produto.id.substring(0, 8),
      descricao: produto.name || "",
      valor_unitario: produto.price || 0,
    };

    const calculated = calculateTotals(newData);
    setFormData({ ...newData, ...calculated });
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Adicionar Produto"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="produto" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="produto">Dados do Produto</TabsTrigger>
            <TabsTrigger value="impostos">Impostos</TabsTrigger>
          </TabsList>

          <TabsContent value="produto" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="produto" className="required">
                Produto
              </Label>
              <ComboboxAsync
                value={formData.id}
                onValueChange={handleProdutoChange}
                searchFunction={searchProdutos}
                placeholder="Busque por nome ou código..."
                emptyText="Nenhum produto encontrado"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">
                  Código
                </Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => handleInputChange("codigo", e.target.value)}
                  placeholder="Ex: PROD001"
                />
              </div>

              <div>
                <Label htmlFor="ncm" className="required">
                  NCM
                </Label>
                <Input
                  id="ncm"
                  value={formData.ncm}
                  onChange={(e) => handleInputChange("ncm", e.target.value)}
                  placeholder="Ex: 84714100"
                  maxLength={8}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao" className="required">
                Descrição
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                placeholder="Descrição completa do produto"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cfop" className="required">
                  CFOP
                </Label>
                <Select
                  value={formData.cfop}
                  onValueChange={(value) => handleInputChange("cfop", value)}
                >
                  <SelectTrigger id="cfop">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5102">5102 - Venda</SelectItem>
                    <SelectItem value="5405">5405 - Venda NF Complementar</SelectItem>
                    <SelectItem value="5929">5929 - Outras Saídas</SelectItem>
                    <SelectItem value="6102">6102 - Venda Interestadual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unidade" className="required">
                  Unidade
                </Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => handleInputChange("unidade", value)}
                >
                  <SelectTrigger id="unidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN - Unidade</SelectItem>
                    <SelectItem value="KG">KG - Quilograma</SelectItem>
                    <SelectItem value="PC">PC - Peça</SelectItem>
                    <SelectItem value="MT">MT - Metro</SelectItem>
                    <SelectItem value="LT">LT - Litro</SelectItem>
                    <SelectItem value="CX">CX - Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantidade" className="required">
                  Quantidade
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantidade}
                  onChange={(e) =>
                    handleInputChange("quantidade", parseFloat(e.target.value) || 0)
                  }
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="valor_unitario" className="required">
                  Valor Unitário
                </Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_unitario}
                  onChange={(e) =>
                    handleInputChange("valor_unitario", parseFloat(e.target.value) || 0)
                  }
                  className="font-mono"
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-base">Valor Total do Produto</Label>
              <p className="text-2xl font-mono font-bold mt-2">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(formData.valor_total)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="impostos" className="space-y-4 mt-4">
            {/* ICMS */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">ICMS - Imposto sobre Circulação de Mercadorias</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icms_aliquota">Alíquota (%)</Label>
                  <Input
                    id="icms_aliquota"
                    type="number"
                    step="0.01"
                    value={formData.icms_aliquota}
                    onChange={(e) =>
                      handleInputChange("icms_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor ICMS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.icms_valor)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* IPI */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">IPI - Imposto sobre Produtos Industrializados</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ipi_aliquota">Alíquota (%)</Label>
                  <Input
                    id="ipi_aliquota"
                    type="number"
                    step="0.01"
                    value={formData.ipi_aliquota}
                    onChange={(e) =>
                      handleInputChange("ipi_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor IPI</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.ipi_valor)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* PIS */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">PIS - Programa de Integração Social</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pis_aliquota">Alíquota (%)</Label>
                  <Input
                    id="pis_aliquota"
                    type="number"
                    step="0.01"
                    value={formData.pis_aliquota}
                    onChange={(e) =>
                      handleInputChange("pis_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor PIS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.pis_valor)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* COFINS */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">COFINS - Contribuição para Financiamento da Seguridade Social</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cofins_aliquota">Alíquota (%)</Label>
                  <Input
                    id="cofins_aliquota"
                    type="number"
                    step="0.01"
                    value={formData.cofins_aliquota}
                    onChange={(e) =>
                      handleInputChange("cofins_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor COFINS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.cofins_valor)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
