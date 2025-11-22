import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import NFeProductsTable from "@/components/fiscal/NFeProductsTable";
import NFeProductDialog from "@/components/fiscal/NFeProductDialog";
import { ComboboxAsync } from "@/components/ui/combobox-async";
import { useNFe } from "@/hooks/useNFe";
import { useNFeItems } from "@/hooks/useNFeItems";
import { useAsyncSearch } from "@/hooks/useAsyncSearch";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

const UF_BRASILEIRAS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function NFeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const { currentOrganization } = useOrganization();

  const { createNFe, updateNFe, getNFeById } = useNFe();
  const { items: nfeItems, addItem, updateItem, removeItem, loadItems } = useNFeItems(id || "");
  const { searchPessoas } = useAsyncSearch();

  const fromOrder = location.state?.fromOrder || false;
  const orderData = location.state?.orderData;
  const orderItems = location.state?.orderItems || [];

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Cliente
    customer_id: "",
    customer_name: "",
    customer_document: "",
    customer_ie: "",
    customer_address: "",
    customer_number: "",
    customer_district: "",
    customer_city: "",
    customer_state: "",
    customer_zip: "",

    // Operação
    operation_nature: "VENDA",
    operation_type: "1",
    purpose: "1",
    series: "1",

    // Totais
    icms_base: "0.00",
    icms_total: "0.00",
    freight_total: "0.00",
    insurance_total: "0.00",
    discount_total: "0.00",
    other_expenses: "0.00",
    ipi_total: "0.00",
    pis_total: "0.00",
    cofins_total: "0.00",
    products_total: "0.00",
    nfe_total: "0.00",

    // Informações adicionais
    additional_info: "",
    tax_info: "",
  });

  // Carregar NFe se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      loadNFe();
    }
  }, [id, isEditing]);

  // Inicializar com dados do pedido
  useEffect(() => {
    if (fromOrder && orderData) {
      loadOrderData();
    }
  }, [fromOrder, orderData]);

  const loadNFe = async () => {
    try {
      setLoading(true);
      const nfe = await getNFeById(id!);
      if (nfe) {
        setFormData({
          customer_id: nfe.customer_id || "",
          customer_name: nfe.customer_name || "",
          customer_document: nfe.customer_document || "",
          customer_ie: nfe.customer_ie || "",
          customer_address: nfe.customer_address || "",
          customer_number: nfe.customer_number || "",
          customer_district: nfe.customer_district || "",
          customer_city: nfe.customer_city || "",
          customer_state: nfe.customer_state || "",
          customer_zip: nfe.customer_zip || "",
          operation_nature: nfe.operation_nature || "VENDA",
          operation_type: nfe.operation_type || "1",
          purpose: nfe.purpose || "1",
          series: nfe.series || "1",
          icms_base: nfe.icms_base?.toString() || "0.00",
          icms_total: nfe.icms_total?.toString() || "0.00",
          freight_total: nfe.freight_total?.toString() || "0.00",
          insurance_total: nfe.insurance_total?.toString() || "0.00",
          discount_total: nfe.discount_total?.toString() || "0.00",
          other_expenses: nfe.other_expenses?.toString() || "0.00",
          ipi_total: nfe.ipi_total?.toString() || "0.00",
          pis_total: nfe.pis_total?.toString() || "0.00",
          cofins_total: nfe.cofins_total?.toString() || "0.00",
          products_total: nfe.products_total?.toString() || "0.00",
          nfe_total: nfe.nfe_total?.toString() || "0.00",
          additional_info: nfe.additional_info || "",
          tax_info: nfe.tax_info || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar NFe:", error);
      toast.error("Erro ao carregar NFe");
    } finally {
      setLoading(false);
    }
  };

  const loadOrderData = async () => {
    if (!orderData) return;

    // Carregar dados do cliente
    if (orderData.customer_id) {
      const { data: pessoa } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", orderData.customer_id)
        .single();

      if (pessoa) {
        setFormData((prev) => ({
          ...prev,
          customer_id: pessoa.id,
          customer_name: pessoa.nome,
          customer_document: pessoa.cpf_cnpj || "",
          customer_ie: pessoa.inscricao_estadual || "",
          customer_address: pessoa.endereco || "",
          customer_number: pessoa.numero || "",
          customer_district: pessoa.bairro || "",
          customer_city: pessoa.cidade || "",
          customer_state: pessoa.estado || "",
          customer_zip: pessoa.cep || "",
        }));
      }
    }

    // Carregar produtos do pedido
    const mappedProducts = await Promise.all(
      orderItems.map(async (item: any) => {
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

        return {
          id: crypto.randomUUID(),
          product_id: item.product_id,
          codigo: product?.sku || item.product_id.substring(0, 8),
          descricao: item.product_name,
          ncm: product?.ncm || "00000000",
          cfop: "5102",
          unidade: product?.unit || "UN",
          quantidade: item.quantity,
          valor_unitario: item.unit_price,
          valor_total: item.total_price,
          icms_aliquota: 0,
          icms_valor: 0,
          ipi_aliquota: 0,
          ipi_valor: 0,
          pis_aliquota: 0,
          pis_valor: 0,
          cofins_aliquota: 0,
          cofins_valor: 0,
        };
      })
    );

    setProdutos(mappedProducts);
    updateTotals(mappedProducts);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = async (customerId: string) => {
    try {
      const { data: pessoa } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", customerId)
        .single();

      if (pessoa) {
        setFormData((prev) => ({
          ...prev,
          customer_id: pessoa.id,
          customer_name: pessoa.nome,
          customer_document: pessoa.cpf_cnpj || "",
          customer_ie: pessoa.inscricao_estadual || "",
          customer_address: pessoa.endereco || "",
          customer_number: pessoa.numero || "",
          customer_district: pessoa.bairro || "",
          customer_city: pessoa.cidade || "",
          customer_state: pessoa.estado || "",
          customer_zip: pessoa.cep || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      toast.error("Erro ao carregar dados do cliente");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleSaveProduct = (product: any) => {
    if (editingProduct) {
      const updatedProducts = produtos.map((p) =>
        p.id === product.id ? product : p
      );
      setProdutos(updatedProducts);
      updateTotals(updatedProducts);
    } else {
      const newProducts = [...produtos, product];
      setProdutos(newProducts);
      updateTotals(newProducts);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = produtos.filter((p) => p.id !== productId);
    setProdutos(updatedProducts);
    updateTotals(updatedProducts);
  };

  const updateTotals = (products: any[]) => {
    const totals = products.reduce(
      (acc, product) => {
        acc.valor_produtos += parseFloat(product.valor_total) || 0;
        acc.valor_icms += parseFloat(product.icms_valor) || 0;
        acc.valor_ipi += parseFloat(product.ipi_valor) || 0;
        acc.valor_pis += parseFloat(product.pis_valor) || 0;
        acc.valor_cofins += parseFloat(product.cofins_valor) || 0;
        acc.bc_icms += parseFloat(product.valor_total) || 0;
        return acc;
      },
      {
        valor_produtos: 0,
        valor_icms: 0,
        valor_ipi: 0,
        valor_pis: 0,
        valor_cofins: 0,
        bc_icms: 0,
      }
    );

    const valor_total =
      totals.valor_produtos +
      totals.valor_ipi +
      parseFloat(formData.freight_total || "0") +
      parseFloat(formData.insurance_total || "0") +
      parseFloat(formData.other_expenses || "0") -
      parseFloat(formData.discount_total || "0");

    setFormData((prev) => ({
      ...prev,
      products_total: totals.valor_produtos.toFixed(2),
      icms_total: totals.valor_icms.toFixed(2),
      icms_base: totals.bc_icms.toFixed(2),
      ipi_total: totals.valor_ipi.toFixed(2),
      pis_total: totals.valor_pis.toFixed(2),
      cofins_total: totals.valor_cofins.toFixed(2),
      nfe_total: valor_total.toFixed(2),
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.customer_id) {
        toast.error("Selecione um cliente");
        return;
      }

      if (produtos.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }

      setLoading(true);

      const nfeData = {
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        customer_document: formData.customer_document,
        customer_ie: formData.customer_ie || null,
        customer_address: formData.customer_address,
        customer_number: formData.customer_number,
        customer_district: formData.customer_district,
        customer_city: formData.customer_city,
        customer_state: formData.customer_state,
        customer_zip: formData.customer_zip,
        operation_nature: formData.operation_nature,
        operation_type: formData.operation_type,
        purpose: formData.purpose,
        series: formData.series,
        icms_base: parseFloat(formData.icms_base),
        icms_total: parseFloat(formData.icms_total),
        freight_total: parseFloat(formData.freight_total),
        insurance_total: parseFloat(formData.insurance_total),
        discount_total: parseFloat(formData.discount_total),
        other_expenses: parseFloat(formData.other_expenses),
        ipi_total: parseFloat(formData.ipi_total),
        pis_total: parseFloat(formData.pis_total),
        cofins_total: parseFloat(formData.cofins_total),
        products_total: parseFloat(formData.products_total),
        nfe_total: parseFloat(formData.nfe_total),
        additional_info: formData.additional_info || null,
        tax_info: formData.tax_info || null,
        status: "rascunho",
      };

      let nfeId = id;

      if (isEditing) {
        await updateNFe(id!, nfeData);
      } else {
        const newNFe = await createNFe(nfeData);
        nfeId = newNFe.id;
      }

      // Salvar itens
      for (const produto of produtos) {
        const itemData = {
          nfe_id: nfeId!,
          product_id: produto.product_id,
          product_code: produto.codigo,
          product_description: produto.descricao,
          ncm: produto.ncm,
          cfop: produto.cfop,
          unit: produto.unidade,
          quantity: produto.quantidade,
          unit_price: produto.valor_unitario,
          total_price: produto.valor_total,
          icms_rate: produto.icms_aliquota,
          icms_value: produto.icms_valor,
          ipi_rate: produto.ipi_aliquota,
          ipi_value: produto.ipi_valor,
          pis_rate: produto.pis_aliquota,
          pis_value: produto.pis_valor,
          cofins_rate: produto.cofins_aliquota,
          cofins_value: produto.cofins_valor,
        };

        await addItem(itemData);
      }

      toast.success(
        isEditing ? "NFe atualizada com sucesso!" : "NFe criada com sucesso!"
      );
      navigate("/fiscal/nfe");
    } catch (error) {
      console.error("Erro ao salvar NFe:", error);
      toast.error("Erro ao salvar NFe");
    } finally {
      setLoading(false);
    }
  };

  const handleEmit = async () => {
    try {
      if (!formData.customer_id) {
        toast.error("Selecione um cliente");
        return;
      }

      if (produtos.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }

      // Primeiro salva
      await handleSave();

      // TODO: Implementar integração com SEFAZ
      toast.info("Funcionalidade de autorização será implementada em breve");
    } catch (error) {
      console.error("Erro ao emitir NFe:", error);
      toast.error("Erro ao emitir NFe");
    }
  };

  if (loading) {
    return (
      <div className="container-comfortable flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="title-xl">
              {isEditing ? "Editar NFe" : "Nova NFe - Modelo 55"}
              {fromOrder && (
                <span className="text-sm font-normal text-muted-foreground ml-3">
                  (Originada do Pedido #{orderData?.order_number})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              {fromOrder
                ? "Verifique e complete os dados para emissão da nota fiscal"
                : "Preencha os dados para emissão da nota fiscal"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/fiscal/nfe")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        <Card className="bg-level-2">
          <div className="space-y-6">
            {/* Dados do Destinatário */}
            <div>
              <h2 className="title-md mb-4">Dados do Destinatário</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-full">
                  <Label htmlFor="customer_id" className="required">
                    Cliente
                  </Label>
                  <ComboboxAsync
                    value={formData.customer_id}
                    onValueChange={handleCustomerSelect}
                    searchFunction={(query) => searchPessoas(query, "cliente")}
                    placeholder="Busque o cliente..."
                    emptyText="Nenhum cliente encontrado"
                  />
                </div>

                <div>
                  <Label htmlFor="customer_document" className="required">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="customer_document"
                    name="customer_document"
                    value={formData.customer_document}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="customer_ie">Inscrição Estadual</Label>
                  <Input
                    id="customer_ie"
                    name="customer_ie"
                    value={formData.customer_ie}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <Label htmlFor="customer_address" className="required">
                    Endereço
                  </Label>
                  <Input
                    id="customer_address"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_number" className="required">
                    Número
                  </Label>
                  <Input
                    id="customer_number"
                    name="customer_number"
                    value={formData.customer_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_district" className="required">
                    Bairro
                  </Label>
                  <Input
                    id="customer_district"
                    name="customer_district"
                    value={formData.customer_district}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_city" className="required">
                    Cidade
                  </Label>
                  <Input
                    id="customer_city"
                    name="customer_city"
                    value={formData.customer_city}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_state" className="required">
                    UF
                  </Label>
                  <Select
                    value={formData.customer_state}
                    onValueChange={(value) =>
                      handleSelectChange("customer_state", value)
                    }
                  >
                    <SelectTrigger id="customer_state">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_BRASILEIRAS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer_zip" className="required">
                    CEP
                  </Label>
                  <Input
                    id="customer_zip"
                    name="customer_zip"
                    value={formData.customer_zip}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados da Operação */}
            <div>
              <h2 className="title-md mb-4">Dados da Operação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="operation_nature" className="required">
                    Natureza da Operação
                  </Label>
                  <Input
                    id="operation_nature"
                    name="operation_nature"
                    value={formData.operation_nature}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="operation_type" className="required">
                    Tipo de Operação
                  </Label>
                  <Select
                    value={formData.operation_type}
                    onValueChange={(value) =>
                      handleSelectChange("operation_type", value)
                    }
                  >
                    <SelectTrigger id="operation_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Entrada</SelectItem>
                      <SelectItem value="1">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purpose" className="required">
                    Finalidade
                  </Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value) =>
                      handleSelectChange("purpose", value)
                    }
                  >
                    <SelectTrigger id="purpose">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Normal</SelectItem>
                      <SelectItem value="2">Complementar</SelectItem>
                      <SelectItem value="3">Ajuste</SelectItem>
                      <SelectItem value="4">Devolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="series" className="required">
                    Série
                  </Label>
                  <Input
                    id="series"
                    name="series"
                    value={formData.series}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Produtos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="title-md">Produtos/Serviços</h2>
                <Button onClick={handleAddProduct} size="sm" className="gap-2">
                  Adicionar Produto
                </Button>
              </div>
              <NFeProductsTable
                products={produtos}
                onRemove={handleRemoveProduct}
                onEdit={handleEditProduct}
                onUpdateTotals={() => updateTotals(produtos)}
              />
            </div>

            <Separator />

            {/* Totais */}
            <div>
              <h2 className="title-md mb-4">Totais da NFe</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Base ICMS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(formData.icms_base))}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>

                <div>
                  <Label>Valor ICMS</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(formData.icms_total))}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="freight_total">Valor Frete</Label>
                  <Input
                    id="freight_total"
                    name="freight_total"
                    type="number"
                    step="0.01"
                    value={formData.freight_total}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="insurance_total">Valor Seguro</Label>
                  <Input
                    id="insurance_total"
                    name="insurance_total"
                    type="number"
                    step="0.01"
                    value={formData.insurance_total}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="discount_total">Valor Desconto</Label>
                  <Input
                    id="discount_total"
                    name="discount_total"
                    type="number"
                    step="0.01"
                    value={formData.discount_total}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="other_expenses">Outras Despesas</Label>
                  <Input
                    id="other_expenses"
                    name="other_expenses"
                    type="number"
                    step="0.01"
                    value={formData.other_expenses}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>Valor IPI</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(formData.ipi_total))}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>

                <div>
                  <Label>Valor Produtos</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(formData.products_total))}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>

                <div className="col-span-full">
                  <Label className="text-lg">Total da NFe</Label>
                  <Input
                    value={new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(formData.nfe_total))}
                    readOnly
                    className="font-mono font-bold text-lg bg-primary/10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações Adicionais */}
            <div>
              <h2 className="title-md mb-4">Informações Adicionais</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="additional_info">
                    Informações Complementares
                  </Label>
                  <Textarea
                    id="additional_info"
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Informações de interesse do contribuinte"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_info">Informações ao Fisco</Label>
                  <Textarea
                    id="tax_info"
                    name="tax_info"
                    value={formData.tax_info}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Informações de interesse do fisco"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/fiscal/nfe")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button onClick={handleEmit} disabled={loading} className="gap-2">
            <Send className="h-4 w-4" />
            Emitir NFe
          </Button>
        </div>
      </div>

      <NFeProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </div>
  );
}
