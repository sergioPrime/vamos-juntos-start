import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function NFCeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    cliente_nome: "Consumidor Final",
    cliente_cpf_cnpj: "",
    valor_produtos: "100.00",
    valor_desconto: "0.00",
    valor_total: "100.00",
    informacoes_complementares: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="title-xl">
              {isEditing ? "Editar NFC-e" : "Nova NFC-e - Modelo 65"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Nota Fiscal do Consumidor Eletrônica
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
            <Button variant="outline" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        <Card className="bg-level-2">
          <div className="space-y-6">
            <div>
              <h2 className="title-md mb-4">Dados do Cliente (Opcional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                  <Input
                    id="cliente_nome"
                    name="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={handleInputChange}
                    placeholder="Consumidor Final"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente_cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cliente_cpf_cnpj"
                    name="cliente_cpf_cnpj"
                    value={formData.cliente_cpf_cnpj}
                    onChange={handleInputChange}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="title-md mb-4">Totais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor dos Produtos</Label>
                  <Input
                    value={`R$ ${formData.valor_produtos}`}
                    readOnly
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Desconto</Label>
                  <Input
                    value={`R$ ${formData.valor_desconto}`}
                    readOnly
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Valor Total</Label>
                  <Input
                    value={`R$ ${formData.valor_total}`}
                    readOnly
                    className="font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="title-md mb-4">Informações Adicionais</h2>
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
                  placeholder="Informações adicionais sobre a venda..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleEmit} size="lg" className="gap-2">
                <Send className="h-4 w-4" />
                Emitir NFC-e
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
