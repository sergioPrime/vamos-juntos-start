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
import { ArrowLeft, Save, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import NFeProductsTable from "@/components/fiscal/NFeProductsTable";
import NFeProductDialog from "@/components/fiscal/NFeProductDialog";

export default function NFCeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;

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
    pis_cst: "01",
    pis_aliquota: "0.00",
    pis_valor: "0.00",
    cofins_cst: "01",
    cofins_aliquota: "0.00",
    cofins_valor: "0.00",
  }));

  const [formData, setFormData] = useState({
    // Dados do Destinatário (Opcional para NFC-e)
    cliente_nome: "Consumidor Final",
    cliente_cpf_cnpj: "",
    
    // Dados da NFC-e
    natureza_operacao: "VENDA AO CONSUMIDOR",
    serie: "1",
    
    // Produtos/Serviços
    produtos: initialProducts,

    // Valores Totalizadores
    valor_desconto: "0.00",
    valor_produtos: orderData?.subtotal?.toFixed(2) || "0.00",
    valor_total: orderData?.total_amount?.toFixed(2) || "0.00",

    // Informações Adicionais
    informacoes_complementares: "",
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
        acc.valor_produtos += parseFloat(product.valor_total);
        return acc;
      },
      {
        valor_produtos: 0,
      }
    );

    const valor_total =
      totals.valor_produtos - parseFloat(formData.valor_desconto || "0");

    setFormData((prev) => ({
      ...prev,
      valor_produtos: totals.valor_produtos.toFixed(2),
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
      if (parseFloat(formData.valor_produtos) <= 0) {
        toast.error("Adicione produtos à nota");
        return;
      }

      toast.success(
        isEditing ? "NFC-e salva com sucesso!" : "NFC-e criada com sucesso!"
      );
      
      navigate("/fiscal/nfce");
    } catch (error) {
      toast.error("Erro ao salvar NFC-e");
      console.error(error);
    }
  };

  const handleEmit = async () => {
    try {
      if (parseFloat(formData.valor_produtos) <= 0) {
        toast.error("Adicione produtos à nota");
        return;
      }

      toast.success("NFC-e enviada para autorização!");
      
      navigate("/fiscal/nfce");
    } catch (error) {
      toast.error("Erro ao emitir NFC-e");
      console.error(error);
    }
  };

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header com botões fixos no topo direito */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="title-xl">
              {isEditing ? "Editar NFC-e" : "Nova NFC-e - Modelo 65"}
              {fromOrder && (
                <span className="text-sm font-normal text-muted-foreground ml-3">
                  (Originada do Pedido #{orderData?.order_number})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              {fromOrder 
                ? "Verifique e complete os dados para emissão da nota fiscal ao consumidor"
                : "Preencha os dados para emissão da nota fiscal ao consumidor"
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/fiscal/nfce")}
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
            {/* Seção: Dados do Destinatário (Opcional para NFC-e) */}
            <div>
              <h2 className="title-md mb-4">Dados do Consumidor (Opcional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_nome">
                    Nome do Consumidor
                  </Label>
                  <Input
                    id="cliente_nome"
                    name="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={handleInputChange}
                    placeholder="Consumidor Final"
                  />
                </div>

                <div>
                  <Label htmlFor="cliente_cpf_cnpj">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="cliente_cpf_cnpj"
                    name="cliente_cpf_cnpj"
                    value={formData.cliente_cpf_cnpj}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção: Dados da NFC-e */}
            <div>
              <h2 className="title-md mb-4">Dados da Operação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <h2 className="title-md">Produtos</h2>
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
              <h2 className="title-md mb-4">Totais da NFC-e</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="valor_produtos">Valor dos Produtos</Label>
                  <Input
                    id="valor_produtos"
                    name="valor_produtos"
                    value={formData.valor_produtos}
                    readOnly
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_desconto">Desconto</Label>
                  <Input
                    id="valor_desconto"
                    name="valor_desconto"
                    value={formData.valor_desconto}
                    onChange={handleInputChange}
                    onBlur={() => updateTotals(formData.produtos)}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_total">Valor Total</Label>
                  <Input
                    id="valor_total"
                    name="valor_total"
                    value={formData.valor_total}
                    readOnly
                    className="font-mono font-bold text-lg"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção: Informações Adicionais */}
            <div>
              <h2 className="title-md mb-4">Informações Adicionais</h2>
              <div>
                <Label htmlFor="informacoes_complementares">
                  Observações
                </Label>
                <Textarea
                  id="informacoes_complementares"
                  name="informacoes_complementares"
                  value={formData.informacoes_complementares}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Informações complementares..."
                />
              </div>
            </div>

            {/* Botão de Emitir */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleEmit}
                size="lg"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Emitir NFC-e
              </Button>
            </div>
          </div>
        </Card>

        {/* Dialog para adicionar/editar produtos */}
        <NFeProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          product={editingProduct}
          onSave={handleSaveProduct}
        />
      </div>
    </div>
  );
}
