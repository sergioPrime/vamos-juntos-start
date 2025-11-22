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
  const { currentOrg } = useOrganization();
  const { searchPessoas } = useAsyncSearch();

  const fromOrder = location.state?.fromOrder || false;
  const orderData = location.state?.orderData;
  const orderItems = location.state?.orderItems || [];

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Destinatário
    destinatario_id: "",
    destinatario_nome: "",
    destinatario_cpf_cnpj: "",
    destinatario_ie: "",
    destinatario_endereco: "",
    destinatario_numero: "",
    destinatario_bairro: "",
    destinatario_cidade: "",
    destinatario_uf: "",
    destinatario_cep: "",

    // Operação
    natureza_operacao: "VENDA",
    tipo_operacao: "1",
    finalidade: "1",
    serie: "1",

    // Totais
    bc_icms: "0.00",
    valor_icms: "0.00",
    valor_frete: "0.00",
    valor_seguro: "0.00",
    valor_desconto: "0.00",
    valor_outras_despesas: "0.00",
    valor_ipi: "0.00",
    valor_pis: "0.00",
    valor_cofins: "0.00",
    valor_produtos: "0.00",
    valor_total: "0.00",

    // Informações adicionais
    informacoes_complementares: "",
    informacoes_fisco: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadNFeData();
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (fromOrder && orderData) {
      loadOrderData();
    }
  }, [fromOrder, orderData]);

  const loadNFeData = async () => {
    try {
      setLoading(true);
      const { data: nfe, error } = await supabase
        .from("nfe")
        .select("*, nfe_items(*)")
        .eq("id", id!)
        .single();

      if (error) throw error;

      if (nfe) {
        setFormData({
          destinatario_id: nfe.destinatario_id || "",
          destinatario_nome: nfe.destinatario_nome || "",
          destinatario_cpf_cnpj: nfe.destinatario_cpf_cnpj || "",
          destinatario_ie: nfe.destinatario_ie || "",
          destinatario_endereco: nfe.destinatario_endereco || "",
          destinatario_numero: nfe.destinatario_numero || "",
          destinatario_bairro: nfe.destinatario_bairro || "",
          destinatario_cidade: nfe.destinatario_cidade || "",
          destinatario_uf: nfe.destinatario_uf || "",
          destinatario_cep: nfe.destinatario_cep || "",
          natureza_operacao: nfe.natureza_operacao || "VENDA",
          tipo_operacao: nfe.tipo_operacao || "1",
          finalidade: nfe.finalidade || "1",
          serie: nfe.serie || "1",
          bc_icms: nfe.bc_icms?.toString() || "0.00",
          valor_icms: nfe.valor_icms?.toString() || "0.00",
          valor_frete: nfe.valor_frete?.toString() || "0.00",
          valor_seguro: nfe.valor_seguro?.toString() || "0.00",
          valor_desconto: nfe.valor_desconto?.toString() || "0.00",
          valor_outras_despesas: nfe.valor_outras_despesas?.toString() || "0.00",
          valor_ipi: nfe.valor_ipi?.toString() || "0.00",
          valor_pis: nfe.valor_pis?.toString() || "0.00",
          valor_cofins: nfe.valor_cofins?.toString() || "0.00",
          valor_produtos: nfe.valor_produtos?.toString() || "0.00",
          valor_total: nfe.valor_total?.toString() || "0.00",
          informacoes_complementares: nfe.informacoes_complementares || "",
          informacoes_fisco: nfe.informacoes_fisco || "",
        });

        // Carregar itens
        if (nfe.nfe_items) {
          const items = nfe.nfe_items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            codigo: item.codigo_produto,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            icms_aliquota: item.icms_aliquota || 0,
            icms_valor: item.icms_valor || 0,
            ipi_aliquota: item.ipi_aliquota || 0,
            ipi_valor: item.ipi_valor || 0,
            pis_aliquota: item.pis_aliquota || 0,
            pis_valor: item.pis_valor || 0,
            cofins_aliquota: item.cofins_aliquota || 0,
            cofins_valor: item.cofins_valor || 0,
          }));
          setProdutos(items);
        }
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
          destinatario_id: pessoa.id,
          destinatario_nome: pessoa.razao_social || pessoa.nome_fantasia,
          destinatario_cpf_cnpj: pessoa.documento || "",
          destinatario_ie: "", // Tabela pessoas não tem IE
          destinatario_endereco: pessoa.endereco || "",
          destinatario_numero: "", // Extrair do endereco se necessário
          destinatario_bairro: "", // Não existe na tabela pessoas
          destinatario_cidade: pessoa.cidade || "",
          destinatario_uf: pessoa.uf || "",
          destinatario_cep: pessoa.cep || "",
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
          ncm: product?.ncm_code || "00000000",
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
          destinatario_id: pessoa.id,
          destinatario_nome: pessoa.razao_social || pessoa.nome_fantasia,
          destinatario_cpf_cnpj: pessoa.documento || "",
          destinatario_ie: "",
          destinatario_endereco: pessoa.endereco || "",
          destinatario_numero: "",
          destinatario_bairro: "",
          destinatario_cidade: pessoa.cidade || "",
          destinatario_uf: pessoa.uf || "",
          destinatario_cep: pessoa.cep || "",
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
      parseFloat(formData.valor_frete || "0") +
      parseFloat(formData.valor_seguro || "0") +
      parseFloat(formData.valor_outras_despesas || "0") -
      parseFloat(formData.valor_desconto || "0");

    setFormData((prev) => ({
      ...prev,
      valor_produtos: totals.valor_produtos.toFixed(2),
      valor_icms: totals.valor_icms.toFixed(2),
      bc_icms: totals.bc_icms.toFixed(2),
      valor_ipi: totals.valor_ipi.toFixed(2),
      valor_pis: totals.valor_pis.toFixed(2),
      valor_cofins: totals.valor_cofins.toFixed(2),
      valor_total: valor_total.toFixed(2),
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.destinatario_id) {
        toast.error("Selecione um cliente");
        return;
      }

      if (produtos.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }

      setLoading(true);

      if (!currentOrg) {
        toast.error("Organização não encontrada");
        return;
      }

      const nfeData: any = {
        org_id: currentOrg.id,
        destinatario_id: formData.destinatario_id,
        destinatario_nome: formData.destinatario_nome,
        destinatario_cpf_cnpj: formData.destinatario_cpf_cnpj,
        destinatario_ie: formData.destinatario_ie || null,
        destinatario_endereco: formData.destinatario_endereco,
        destinatario_numero: formData.destinatario_numero,
        destinatario_bairro: formData.destinatario_bairro,
        destinatario_cidade: formData.destinatario_cidade,
        destinatario_uf: formData.destinatario_uf,
        destinatario_cep: formData.destinatario_cep,
        natureza_operacao: formData.natureza_operacao,
        tipo_operacao: formData.tipo_operacao,
        finalidade: formData.finalidade,
        serie: formData.serie,
        bc_icms: parseFloat(formData.bc_icms),
        valor_icms: parseFloat(formData.valor_icms),
        valor_frete: parseFloat(formData.valor_frete),
        valor_seguro: parseFloat(formData.valor_seguro),
        valor_desconto: parseFloat(formData.valor_desconto),
        valor_outras_despesas: parseFloat(formData.valor_outras_despesas),
        valor_ipi: parseFloat(formData.valor_ipi),
        valor_pis: parseFloat(formData.valor_pis),
        valor_cofins: parseFloat(formData.valor_cofins),
        valor_produtos: parseFloat(formData.valor_produtos),
        valor_total: parseFloat(formData.valor_total),
        informacoes_complementares: formData.informacoes_complementares || null,
        informacoes_fisco: formData.informacoes_fisco || null,
        status: "rascunho",
      };

      let nfeId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("nfe")
          .update(nfeData)
          .eq("id", id!);

        if (error) throw error;

        // Remover itens antigos
        await supabase.from("nfe_items").delete().eq("nfe_id", id!);
      } else {
        const { data: newNFe, error } = await supabase
          .from("nfe")
          .insert(nfeData)
          .select()
          .single();

        if (error) throw error;
        nfeId = newNFe.id;
      }

      // Salvar itens
      const itemsToInsert = produtos.map((produto) => ({
        org_id: currentOrg.id,
        nfe_id: nfeId!,
        product_id: produto.product_id,
        codigo_produto: produto.codigo,
        descricao: produto.descricao,
        ncm: produto.ncm,
        cfop: produto.cfop,
        unidade: produto.unidade,
        quantidade: produto.quantidade,
        valor_unitario: produto.valor_unitario,
        valor_total: produto.valor_total,
        icms_aliquota: produto.icms_aliquota,
        icms_valor: produto.icms_valor,
        ipi_aliquota: produto.ipi_aliquota,
        ipi_valor: produto.ipi_valor,
        pis_aliquota: produto.pis_aliquota,
        pis_valor: produto.pis_valor,
        cofins_aliquota: produto.cofins_aliquota,
        cofins_valor: produto.cofins_valor,
        icms_origem: "0",
        icms_cst: "00",
        pis_cst: "01",
        cofins_cst: "01",
      }));

      const { error: itemsError } = await supabase
        .from("nfe_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

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
      if (!formData.destinatario_id) {
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
                  <Label htmlFor="destinatario_id" className="required">
                    Cliente
                  </Label>
                  <ComboboxAsync
                    value={formData.destinatario_id}
                    onValueChange={handleCustomerSelect}
                    searchFunction={(query) => searchPessoas(query, "cliente")}
                    placeholder="Busque o cliente..."
                    emptyText="Nenhum cliente encontrado"
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_cpf_cnpj" className="required">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="destinatario_cpf_cnpj"
                    name="destinatario_cpf_cnpj"
                    value={formData.destinatario_cpf_cnpj}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_ie">Inscrição Estadual</Label>
                  <Input
                    id="destinatario_ie"
                    name="destinatario_ie"
                    value={formData.destinatario_ie}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <Label htmlFor="destinatario_endereco" className="required">
                    Endereço
                  </Label>
                  <Input
                    id="destinatario_endereco"
                    name="destinatario_endereco"
                    value={formData.destinatario_endereco}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_numero" className="required">
                    Número
                  </Label>
                  <Input
                    id="destinatario_numero"
                    name="destinatario_numero"
                    value={formData.destinatario_numero}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_bairro" className="required">
                    Bairro
                  </Label>
                  <Input
                    id="destinatario_bairro"
                    name="destinatario_bairro"
                    value={formData.destinatario_bairro}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_cidade" className="required">
                    Cidade
                  </Label>
                  <Input
                    id="destinatario_cidade"
                    name="destinatario_cidade"
                    value={formData.destinatario_cidade}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="destinatario_uf" className="required">
                    UF
                  </Label>
                  <Select
                    value={formData.destinatario_uf}
                    onValueChange={(value) =>
                      handleSelectChange("destinatario_uf", value)
                    }
                  >
                    <SelectTrigger id="destinatario_uf">
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
                  <Label htmlFor="destinatario_cep" className="required">
                    CEP
                  </Label>
                  <Input
                    id="destinatario_cep"
                    name="destinatario_cep"
                    value={formData.destinatario_cep}
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
                  <Label htmlFor="natureza_operacao" className="required">
                    Natureza da Operação
                  </Label>
                  <Input
                    id="natureza_operacao"
                    name="natureza_operacao"
                    value={formData.natureza_operacao}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="tipo_operacao" className="required">
                    Tipo de Operação
                  </Label>
                  <Select
                    value={formData.tipo_operacao}
                    onValueChange={(value) =>
                      handleSelectChange("tipo_operacao", value)
                    }
                  >
                    <SelectTrigger id="tipo_operacao">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Entrada</SelectItem>
                      <SelectItem value="1">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="finalidade" className="required">
                    Finalidade
                  </Label>
                  <Select
                    value={formData.finalidade}
                    onValueChange={(value) =>
                      handleSelectChange("finalidade", value)
                    }
                  >
                    <SelectTrigger id="finalidade">
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
                  <Label htmlFor="serie" className="required">
                    Série
                  </Label>
                  <Input
                    id="serie"
                    name="serie"
                    value={formData.serie}
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
                    }).format(parseFloat(formData.bc_icms))}
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
                    }).format(parseFloat(formData.valor_icms))}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_frete">Valor Frete</Label>
                  <Input
                    id="valor_frete"
                    name="valor_frete"
                    type="number"
                    step="0.01"
                    value={formData.valor_frete}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_seguro">Valor Seguro</Label>
                  <Input
                    id="valor_seguro"
                    name="valor_seguro"
                    type="number"
                    step="0.01"
                    value={formData.valor_seguro}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_desconto">Valor Desconto</Label>
                  <Input
                    id="valor_desconto"
                    name="valor_desconto"
                    type="number"
                    step="0.01"
                    value={formData.valor_desconto}
                    onChange={(e) => {
                      handleInputChange(e);
                      updateTotals(produtos);
                    }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_outras_despesas">Outras Despesas</Label>
                  <Input
                    id="valor_outras_despesas"
                    name="valor_outras_despesas"
                    type="number"
                    step="0.01"
                    value={formData.valor_outras_despesas}
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
                    }).format(parseFloat(formData.valor_ipi))}
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
                    }).format(parseFloat(formData.valor_produtos))}
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
                    }).format(parseFloat(formData.valor_total))}
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
                  <Label htmlFor="informacoes_complementares">
                    Informações Complementares
                  </Label>
                  <Textarea
                    id="informacoes_complementares"
                    name="informacoes_complementares"
                    value={formData.informacoes_complementares}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Informações de interesse do contribuinte"
                  />
                </div>

                <div>
                  <Label htmlFor="informacoes_fisco">Informações ao Fisco</Label>
                  <Textarea
                    id="informacoes_fisco"
                    name="informacoes_fisco"
                    value={formData.informacoes_fisco}
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
