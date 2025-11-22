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
import { Sparkles } from "lucide-react";

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
  // Tributos antigos (transição)
  icms_aliquota: number;
  icms_valor: number;
  ipi_aliquota: number;
  ipi_valor: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_aliquota: number;
  cofins_valor: number;
  // Reforma Tributária 2026 - IBS/CBS/IS
  cst_ibs_cbs?: string;
  codigo_classificacao_tributaria?: string;
  // IBS UF (Estadual)
  ibs_uf_aliquota?: number;
  ibs_uf_valor?: number;
  ibs_uf_base_calculo?: number;
  // IBS Municipal
  ibs_mun_aliquota?: number;
  ibs_mun_valor?: number;
  ibs_mun_base_calculo?: number;
  // CBS (Federal)
  cbs_aliquota?: number;
  cbs_valor?: number;
  cbs_base_calculo?: number;
  // IS (Imposto Seletivo)
  is_aliquota?: number;
  is_valor?: number;
  is_base_calculo?: number;
}

interface NFeProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: NFeProduct) => void;
  product?: NFeProduct | null;
  clienteUF?: string;
}

export default function NFeProductDialog({
  open,
  onOpenChange,
  onSave,
  product,
  clienteUF = "SP",
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
    // Tributos antigos (ainda em transição)
    icms_aliquota: 18,
    icms_valor: 0,
    ipi_aliquota: 0,
    ipi_valor: 0,
    pis_aliquota: 1.65,
    pis_valor: 0,
    cofins_aliquota: 7.6,
    cofins_valor: 0,
    // Reforma 2026
    ibs_uf_aliquota: 0,
    ibs_uf_valor: 0,
    ibs_uf_base_calculo: 0,
    ibs_mun_aliquota: 0,
    ibs_mun_valor: 0,
    ibs_mun_base_calculo: 0,
    cbs_aliquota: 0,
    cbs_valor: 0,
    cbs_base_calculo: 0,
    is_aliquota: 0,
    is_valor: 0,
    is_base_calculo: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      const initialData: NFeProduct = {
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
        ibs_uf_aliquota: 0,
        ibs_uf_valor: 0,
        ibs_uf_base_calculo: 0,
        ibs_mun_aliquota: 0,
        ibs_mun_valor: 0,
        ibs_mun_base_calculo: 0,
        cbs_aliquota: 0,
        cbs_valor: 0,
        cbs_base_calculo: 0,
        is_aliquota: 0,
        is_valor: 0,
        is_base_calculo: 0,
      };
      setFormData(initialData);
      
      // Carregar operação fiscal para o CFOP padrão
      if (open && currentOrg) {
        loadFiscalOperation("5102", initialData);
      }
    }
  }, [product, open, currentOrg]);

  const calculateTotals = (data: Partial<NFeProduct>) => {
    const quantidade = data.quantidade || formData.quantidade;
    const valor_unitario = data.valor_unitario || formData.valor_unitario;
    const valor_total = quantidade * valor_unitario;

    // Tributos antigos (transição)
    const icms_aliquota = data.icms_aliquota ?? formData.icms_aliquota;
    const ipi_aliquota = data.ipi_aliquota ?? formData.ipi_aliquota;
    const pis_aliquota = data.pis_aliquota ?? formData.pis_aliquota;
    const cofins_aliquota = data.cofins_aliquota ?? formData.cofins_aliquota;

    const icms_valor = (valor_total * icms_aliquota) / 100;
    const ipi_valor = (valor_total * ipi_aliquota) / 100;
    const pis_valor = (valor_total * pis_aliquota) / 100;
    const cofins_valor = (valor_total * cofins_aliquota) / 100;

    // Novos tributos - Reforma 2026
    const ibs_uf_aliquota = data.ibs_uf_aliquota ?? formData.ibs_uf_aliquota ?? 0;
    const ibs_mun_aliquota = data.ibs_mun_aliquota ?? formData.ibs_mun_aliquota ?? 0;
    const cbs_aliquota = data.cbs_aliquota ?? formData.cbs_aliquota ?? 0;
    const is_aliquota = data.is_aliquota ?? formData.is_aliquota ?? 0;

    const ibs_uf_valor = (valor_total * ibs_uf_aliquota) / 100;
    const ibs_mun_valor = (valor_total * ibs_mun_aliquota) / 100;
    const cbs_valor = (valor_total * cbs_aliquota) / 100;
    const is_valor = (valor_total * is_aliquota) / 100;

    return {
      valor_total,
      // Tributos antigos
      icms_valor,
      ipi_valor,
      pis_valor,
      cofins_valor,
      // Reforma 2026
      ibs_uf_valor,
      ibs_uf_base_calculo: valor_total,
      ibs_mun_valor,
      ibs_mun_base_calculo: valor_total,
      cbs_valor,
      cbs_base_calculo: valor_total,
      is_valor,
      is_base_calculo: valor_total,
    };
  };

  const handleInputChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    
    // Se mudou o CFOP, buscar nova operação fiscal
    if (field === "cfop") {
      loadFiscalOperation(value, newData);
    } else {
      const calculated = calculateTotals(newData);
      setFormData({ ...newData, ...calculated });
    }
  };

  // Buscar produtos
  const searchProdutos = async (query: string) => {
    if (!currentOrg) return [];

    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, unit_price, ncm_code")
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
        ncm: "",
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
      ncm: produto.ncm_code || "",
      valor_unitario: produto.unit_price || 0,
    };

    const calculated = calculateTotals(newData);
    setFormData({ ...newData, ...calculated });
  };

  // Buscar operação fiscal e aplicar alíquotas
  const loadFiscalOperation = async (cfop: string, currentData: Partial<NFeProduct>) => {
    if (!currentOrg || !cfop) return;

    const { data: fiscalOps, error } = await supabase
      .from("fiscal_operations")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("destination_state", clienteUF)
      .contains("cfop_codes", [cfop])
      .limit(1);

    if (error) {
      console.error("Erro ao buscar operação fiscal:", error);
      const calculated = calculateTotals(currentData);
      setFormData({ ...currentData, ...calculated } as NFeProduct);
      return;
    }

    // Se encontrou operação fiscal, aplicar as alíquotas
    if (fiscalOps && fiscalOps.length > 0) {
      const op = fiscalOps[0];
      
      const newData = {
        ...currentData,
        // Tributos antigos (transição até 2033)
        icms_aliquota: op.internal_icms_rate || 0,
        ipi_aliquota: op.ipi_rate_general || 0,
        pis_aliquota: 1.65,
        cofins_aliquota: 7.6,
        // Reforma 2026 - Novos tributos
        ibs_uf_aliquota: op.ibs_uf_aliquota || 0,
        ibs_mun_aliquota: op.ibs_municipal_aliquota || 0,
        cbs_aliquota: op.cbs_aliquota || 0,
        is_aliquota: op.is_aliquota || 0,
        codigo_classificacao_tributaria: op.codigo_classificacao_tributaria,
      };

      const calculated = calculateTotals(newData);
      setFormData({ ...newData, ...calculated } as NFeProduct);
      
      toast.success("Impostos aplicados automaticamente (transição Reforma 2026)");
    } else {
      // Se não encontrou, manter os valores atuais
      const calculated = calculateTotals(currentData);
      setFormData({ ...currentData, ...calculated } as NFeProduct);
      toast.info("Nenhuma operação fiscal configurada para este CFOP");
    }
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Adicionar Produto"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="produto" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produto">Dados do Produto</TabsTrigger>
            <TabsTrigger value="impostos">Impostos (Antigos)</TabsTrigger>
            <TabsTrigger value="reforma2026">
              <Sparkles className="h-3 w-3 mr-1" />
              Reforma 2026
            </TabsTrigger>
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
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ <strong>Transição:</strong> Estes impostos serão gradualmente substituídos até 2033
              </p>
            </div>

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

          <TabsContent value="reforma2026" className="space-y-4 mt-4">
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4">
              <p className="text-sm">
                <Sparkles className="h-4 w-4 inline mr-1" />
                <strong>Reforma Tributária 2026:</strong> Novos tributos que substituirão ICMS, ISS, PIS e COFINS gradualmente até 2033
              </p>
            </div>

            {/* IBS UF (Estadual) */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">IBS-UF - Imposto sobre Bens e Serviços (Estadual)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ibs_uf_aliquota">Alíquota Estadual (%)</Label>
                  <Input
                    id="ibs_uf_aliquota"
                    type="number"
                    step="0.0001"
                    value={formData.ibs_uf_aliquota || 0}
                    onChange={(e) =>
                      handleInputChange("ibs_uf_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor IBS-UF</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.ibs_uf_valor || 0)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* IBS Municipal */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">IBS-Mun - Imposto sobre Bens e Serviços (Municipal)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ibs_mun_aliquota">Alíquota Municipal (%)</Label>
                  <Input
                    id="ibs_mun_aliquota"
                    type="number"
                    step="0.0001"
                    value={formData.ibs_mun_aliquota || 0}
                    onChange={(e) =>
                      handleInputChange("ibs_mun_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor IBS-Mun</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.ibs_mun_valor || 0)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* CBS (Federal) */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">CBS - Contribuição sobre Bens e Serviços (Federal)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cbs_aliquota">Alíquota Federal (%)</Label>
                  <Input
                    id="cbs_aliquota"
                    type="number"
                    step="0.0001"
                    value={formData.cbs_aliquota || 0}
                    onChange={(e) =>
                      handleInputChange("cbs_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor CBS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.cbs_valor || 0)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* IS (Imposto Seletivo) */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">IS - Imposto Seletivo (Federal)</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Aplicável apenas a produtos prejudiciais à saúde ou meio ambiente
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="is_aliquota">Alíquota (%)</Label>
                  <Input
                    id="is_aliquota"
                    type="number"
                    step="0.0001"
                    value={formData.is_aliquota || 0}
                    onChange={(e) =>
                      handleInputChange("is_aliquota", parseFloat(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor IS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(formData.is_valor || 0)}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Totalizador Reforma 2026 */}
            <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-lg">
              <Label className="text-base font-bold">Total Reforma 2026 (IBS + CBS + IS)</Label>
              <p className="text-3xl font-mono font-bold mt-2 text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(
                  (formData.ibs_uf_valor || 0) + 
                  (formData.ibs_mun_valor || 0) + 
                  (formData.cbs_valor || 0) + 
                  (formData.is_valor || 0)
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                * Tributos "por fora" - somados ao valor total da nota
              </p>
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