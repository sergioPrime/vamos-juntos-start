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
import { ArrowLeft, Save, Send, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import NFeProductsTable from "@/components/fiscal/NFeProductsTable";
import NFeProductDialog from "@/components/fiscal/NFeProductDialog";

export default function NFeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const { currentOrg } = useOrganization();
  const [isSaving, setIsSaving] = useState(false);

  // Dados vindos do PDV
  const fromOrder = location.state?.fromOrder || false;
  const orderData = location.state?.orderData;
  const orderItems = location.state?.orderItems || [];

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Inicializar produtos vindos do pedido (se houver)
  const initialProducts = orderItems.map((item: any) => ({
    id: item.product_id,
    codigo: item.product_sku || item.product_id.substring(0, 8),
    descricao: item.product_name,
    ncm: "00000000",
    cfop: "5102",
    unidade: "UN",
    quantidade: item.quantity.toString(),
    valor_unitario: item.unit_price.toFixed(2),
    valor_total: item.total_price.toFixed(2),
    // Tributos
    icms_cst: "00",
    icms_base: item.total_price.toFixed(2),
    icms_aliquota: "0.00",
    icms_valor: "0.00",
    ipi_cst: "99",
    ipi_aliquota: "0.00",
    ipi_valor: "0.00",
    pis_cst: "01",
    pis_aliquota: "0.00",
    pis_valor: "0.00",
    cofins_cst: "01",
    cofins_aliquota: "0.00",
    cofins_valor: "0.00",
  }));

  const [formData, setFormData] = useState({
    // Dados do Destinatário
    cliente_id: "",
    cliente_nome: "",
    cliente_cpf_cnpj: "",
    cliente_ie: "",
    cliente_endereco: "",
    cliente_numero: "",
    cliente_bairro: "",
    cliente_cidade: "",
    cliente_uf: "",
    cliente_cep: "",

    // Dados da NFe
    natureza_operacao: "VENDA",
    tipo_operacao: "1", // 1=Saída
    finalidade: "1", // 1=Normal
    serie: "1",
    
    // Produtos/Serviços
    produtos: initialProducts,

    // Valores Totalizadores
    bc_icms: "0.00",
    valor_icms: "0.00",
    valor_frete: "0.00",
    valor_seguro: "0.00",
    valor_desconto: "0.00",
    valor_outras_despesas: "0.00",
    valor_ipi: "0.00",
    valor_pis: "0.00",
    valor_cofins: "0.00",
    valor_produtos: orderData?.subtotal?.toFixed(2) || "0.00",
    valor_total: orderData?.total_amount?.toFixed(2) || "0.00",

    // Informações Adicionais
    informacoes_complementares: "",
    informacoes_fisco: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      // Editar produto existente
      const updatedProducts = formData.produtos.map((p) =>
        p.id === product.id ? product : p
      );
      setFormData((prev) => ({ ...prev, produtos: updatedProducts }));
    } else {
      // Adicionar novo produto
      setFormData((prev) => ({
        ...prev,
        produtos: [...prev.produtos, product],
      }));
    }
    updateTotals(formData.produtos);
  };

  const handleRemoveProduct = (id: string) => {
    const updatedProducts = formData.produtos.filter((p) => p.id !== id);
    setFormData((prev) => ({ ...prev, produtos: updatedProducts }));
    updateTotals(updatedProducts);
  };

  const updateTotals = (produtos: any[]) => {
    const totals = produtos.reduce(
      (acc, product) => {
        acc.valor_produtos += product.valor_total;
        acc.valor_icms += product.icms_valor;
        acc.valor_ipi += product.ipi_valor;
        acc.valor_pis += product.pis_valor;
        acc.valor_cofins += product.cofins_valor;
        return acc;
      },
      {
        valor_produtos: 0,
        valor_icms: 0,
        valor_ipi: 0,
        valor_pis: 0,
        valor_cofins: 0,
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
      valor_ipi: totals.valor_ipi.toFixed(2),
      valor_pis: totals.valor_pis.toFixed(2),
      valor_cofins: totals.valor_cofins.toFixed(2),
      bc_icms: totals.valor_produtos.toFixed(2),
      valor_total: valor_total.toFixed(2),
    }));
  };

  // Calcular totais ao carregar produtos do pedido
  useEffect(() => {
    if (initialProducts.length > 0) {
      updateTotals(formData.produtos);
    }
  }, []);

  const handleSave = async () => {
    try {
      if (!currentOrg) {
        toast.error("Organização não encontrada");
        return;
      }

      // Validações básicas
      if (!formData.cliente_nome) {
        toast.error("Selecione um cliente");
        return;
      }

      if (formData.produtos.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }

      setIsSaving(true);

      // Salvar como rascunho
      const { data: nfe, error } = await supabase
        .from('nfe')
        .insert({
          org_id: currentOrg,
          serie: formData.serie,
          natureza_operacao: formData.natureza_operacao,
          tipo_operacao: formData.tipo_operacao,
          finalidade: formData.finalidade,
          destinatario_nome: formData.cliente_nome,
          destinatario_cpf_cnpj: formData.cliente_cpf_cnpj,
          destinatario_ie: formData.cliente_ie,
          destinatario_endereco: formData.cliente_endereco,
          destinatario_numero: formData.cliente_numero,
          destinatario_bairro: formData.cliente_bairro,
          destinatario_cidade: formData.cliente_cidade,
          destinatario_uf: formData.cliente_uf,
          destinatario_cep: formData.cliente_cep,
          valor_produtos: parseFloat(formData.valor_produtos),
          valor_frete: parseFloat(formData.valor_frete || '0'),
          valor_seguro: parseFloat(formData.valor_seguro || '0'),
          valor_desconto: parseFloat(formData.valor_desconto || '0'),
          valor_outras_despesas: parseFloat(formData.valor_outras_despesas || '0'),
          valor_total: parseFloat(formData.valor_total),
          valor_icms: parseFloat(formData.valor_icms),
          valor_ipi: parseFloat(formData.valor_ipi),
          valor_pis: parseFloat(formData.valor_pis),
          valor_cofins: parseFloat(formData.valor_cofins),
          informacoes_complementares: formData.informacoes_complementares,
          informacoes_fisco: formData.informacoes_fisco,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw error;

      // Salvar itens
      const itensPromises = formData.produtos.map((produto: any) =>
        supabase.from('nfe_items').insert({
          nfe_id: nfe.id,
          produto_codigo: produto.codigo,
          produto_descricao: produto.descricao,
          ncm: produto.ncm,
          cfop: produto.cfop,
          unidade: produto.unidade,
          quantidade: parseFloat(produto.quantidade),
          valor_unitario: parseFloat(produto.valor_unitario),
          valor_total: parseFloat(produto.valor_total),
          icms_cst: produto.icms_cst,
          icms_base: parseFloat(produto.icms_base),
          icms_aliquota: parseFloat(produto.icms_aliquota),
          icms_valor: parseFloat(produto.icms_valor),
          ipi_cst: produto.ipi_cst,
          ipi_aliquota: parseFloat(produto.ipi_aliquota),
          ipi_valor: parseFloat(produto.ipi_valor),
          pis_cst: produto.pis_cst,
          pis_aliquota: parseFloat(produto.pis_aliquota),
          pis_valor: parseFloat(produto.pis_valor),
          cofins_cst: produto.cofins_cst,
          cofins_aliquota: parseFloat(produto.cofins_aliquota),
          cofins_valor: parseFloat(produto.cofins_valor),
        })
      );

      await Promise.all(itensPromises);

      toast.success("Rascunho salvo com sucesso!");
      navigate("/fiscal/nfe");
    } catch (error: any) {
      console.error("Erro ao salvar NFe:", error);
      toast.error(error.message || "Erro ao salvar NFe");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmit = async () => {
    try {
      if (!currentOrg) {
        toast.error("Organização não encontrada");
        return;
      }

      // Validações antes de emitir
      if (!formData.cliente_nome) {
        toast.error("Selecione um cliente");
        return;
      }

      if (parseFloat(formData.valor_produtos) <= 0) {
        toast.error("Adicione produtos à nota");
        return;
      }

      if (formData.produtos.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }

      setIsSaving(true);

      // Chamar edge function para emitir
      const { data, error } = await supabase.functions.invoke('emitir-nfe', {
        body: {
          nfeData: {
            ...formData,
            org_id: currentOrg,
          },
          produtos: formData.produtos,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao emitir NFe');
      }

      toast.success(`NFe ${data.nfe.numero} emitida com sucesso!`);
      navigate("/fiscal/nfe");
    } catch (error: any) {
      console.error("Erro ao emitir NFe:", error);
      toast.error(error.message || "Erro ao emitir NFe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header com botões fixos no topo direito */}
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
                : "Preencha os dados para emissão da nota fiscal"
              }
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
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Formulário */}
        <Card className="bg-level-2">
          <div className="space-y-6">
            {/* Seção: Dados do Destinatário */}
            <div>
              <h2 className="title-md mb-4">Dados do Destinatário</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-full">
                  <Label htmlFor="cliente_nome" className="required">
                    Cliente
                  </Label>
                  <Input
                    id="cliente_nome"
                    name="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={handleInputChange}
                    placeholder="Selecione ou busque o cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_cpf_cnpj" className="required">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="cliente_cpf_cnpj"
                    name="cliente_cpf_cnpj"
                    value={formData.cliente_cpf_cnpj}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_ie">Inscrição Estadual</Label>
                  <Input
                    id="cliente_ie"
                    name="cliente_ie"
                    value={formData.cliente_ie}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <Label htmlFor="cliente_endereco" className="required">
                    Endereço
                  </Label>
                  <Input
                    id="cliente_endereco"
                    name="cliente_endereco"
                    value={formData.cliente_endereco}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_numero" className="required">
                    Número
                  </Label>
                  <Input
                    id="cliente_numero"
                    name="cliente_numero"
                    value={formData.cliente_numero}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_bairro" className="required">
                    Bairro
                  </Label>
                  <Input
                    id="cliente_bairro"
                    name="cliente_bairro"
                    value={formData.cliente_bairro}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_cidade" className="required">
                    Cidade
                  </Label>
                  <Input
                    id="cliente_cidade"
                    name="cliente_cidade"
                    value={formData.cliente_cidade}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_uf" className="required">
                    UF
                  </Label>
                  <Select
                    value={formData.cliente_uf}
                    onValueChange={(value) =>
                      handleSelectChange("cliente_uf", value)
                    }
                  >
                    <SelectTrigger id="cliente_uf">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                      {/* Adicionar outros estados */}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cliente_cep" className="required">
                    CEP
                  </Label>
                  <Input
                    id="cliente_cep"
                    name="cliente_cep"
                    value={formData.cliente_cep}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção: Dados da NFe */}
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

            {/* Seção: Produtos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="title-md">Produtos/Serviços</h2>
                <Button onClick={handleAddProduct} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
              <NFeProductsTable
                products={formData.produtos}
                onRemove={handleRemoveProduct}
                onEdit={handleEditProduct}
                onUpdateTotals={() => updateTotals(formData.produtos)}
              />
            </div>

            <Separator />

            {/* Seção: Totais */}
            <div>
              <h2 className="title-md mb-4">Totais da NFe</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="valor_produtos">Valor Produtos</Label>
                  <Input
                    id="valor_produtos"
                    name="valor_produtos"
                    type="number"
                    step="0.01"
                    value={formData.valor_produtos}
                    onChange={handleInputChange}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_desconto">Desconto</Label>
                  <Input
                    id="valor_desconto"
                    name="valor_desconto"
                    type="number"
                    step="0.01"
                    value={formData.valor_desconto}
                    onChange={handleInputChange}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_frete">Frete</Label>
                  <Input
                    id="valor_frete"
                    name="valor_frete"
                    type="number"
                    step="0.01"
                    value={formData.valor_frete}
                    onChange={handleInputChange}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_seguro">Seguro</Label>
                  <Input
                    id="valor_seguro"
                    name="valor_seguro"
                    type="number"
                    step="0.01"
                    value={formData.valor_seguro}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    className="font-mono"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="valor_total" className="font-bold">
                    Valor Total
                  </Label>
                  <Input
                    id="valor_total"
                    name="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    readOnly
                    className="font-mono font-bold bg-muted"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção: Informações Adicionais */}
            <div>
              <h2 className="title-md mb-4">Informações Adicionais</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="informacoes_complementares">
                    Informações Complementares
                  </Label>
                  <Textarea
                    id="informacoes_complementares"
                    name="informacoes_complementares"
                    value={formData.informacoes_complementares}
                    onChange={handleInputChange}
                    placeholder="Informações de interesse do contribuinte"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="informacoes_fisco">
                    Informações ao Fisco
                  </Label>
                  <Textarea
                    id="informacoes_fisco"
                    name="informacoes_fisco"
                    value={formData.informacoes_fisco}
                    onChange={handleInputChange}
                    placeholder="Informações de interesse do fisco"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Botões de ação no rodapé */}
        <div className="flex justify-end gap-2 sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/fiscal/nfe")}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button 
            onClick={handleEmit}
            disabled={isSaving}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSaving ? "Emitindo..." : "Emitir NFe"}
          </Button>
        </div>

        {/* Dialog de Produtos */}
        <NFeProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          onSave={handleSaveProduct}
          product={editingProduct}
        />
      </div>
    </div>
  );
}
