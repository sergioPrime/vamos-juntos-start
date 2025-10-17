import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { usePessoas } from "@/hooks/usePessoas"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface QuickCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickCustomerDialog({ open, onOpenChange }: QuickCustomerDialogProps) {
  const { createPessoa } = usePessoas()
  const { currentOrg } = useOrganization()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    documento: "",
    nomeFantasia: "",
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomeFantasia.trim()) {
      toast.error("Nome do Cliente é obrigatório")
      return
    }

    if (!currentOrg?.id || !user?.id) {
      toast.error("Organização ou usuário não encontrado")
      return
    }

    setLoading(true)

    try {
      // Montar endereço completo
      const enderecoCompleto = [
        formData.logradouro,
        formData.numero && `nº ${formData.numero}`,
        formData.complemento && `- ${formData.complemento}`,
        formData.bairro && `- ${formData.bairro}`,
        formData.cidade,
        formData.uf
      ].filter(Boolean).join(" ")

      await createPessoa({
        nome_fantasia: formData.nomeFantasia,
        tipo_pessoa: formData.documento.length > 14 ? "juridica" : "fisica",
        documento: formData.documento || "",
        email_geral: formData.email || "",
        telefone: formData.telefone || "",
        endereco: enderecoCompleto || "",
        cidade: formData.cidade || "",
        uf: formData.uf || "",
        cep: formData.cep || "",
        rotulos: ["Cliente"],
        ativo: true
      })

      toast.success("Cliente cadastrado com sucesso!")
      onOpenChange(false)
      
      // Limpar formulário
      setFormData({
        documento: "",
        nomeFantasia: "",
        email: "",
        telefone: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: ""
      })
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error)
      toast.error("Erro ao cadastrar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="relative pb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-cyan-400/10 p-2 rounded-lg">
              <UserPlus className="h-7 w-7 text-cyan-400" />
            </div>
            <div className="flex flex-col gap-0">
              <div className="text-xs font-medium text-muted-foreground tracking-wide">NOVO</div>
              <DialogTitle className="text-3xl font-bold text-foreground">Cliente</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Linha 1: CPF/CNPJ e Nome */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="documento" className="text-sm font-semibold text-foreground">
                CPF / CNPJ
              </Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => handleInputChange("documento", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-9 space-y-1.5">
              <Label htmlFor="nomeFantasia" className="text-sm font-semibold text-foreground">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                placeholder=""
                required
                className="h-9 bg-background border-input"
              />
            </div>
          </div>

          {/* Linha 2: E-mail e Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-sm font-semibold text-foreground">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
          </div>

          {/* Linha 3: CEP, Logradouro, Número */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cep" className="text-sm font-semibold text-foreground">
                CEP
              </Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleInputChange("cep", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-7 space-y-1.5">
              <Label htmlFor="logradouro" className="text-sm font-semibold text-foreground">
                Logradouro
              </Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => handleInputChange("logradouro", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="numero" className="text-sm font-semibold text-foreground">
                Número
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
          </div>

          {/* Linha 4: Complemento, Bairro, Cidade, UF */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="complemento" className="text-sm font-semibold text-foreground">
                Complemento
              </Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleInputChange("complemento", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="bairro" className="text-sm font-semibold text-foreground">
                Bairro
              </Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange("bairro", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label htmlFor="cidade" className="text-sm font-semibold text-foreground">
                Cidade
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                placeholder=""
                className="h-9 bg-background border-input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="uf" className="text-sm font-semibold text-foreground">
                UF
              </Label>
              <Select value={formData.uf} onValueChange={(value) => handleInputChange("uf", value)}>
                <SelectTrigger id="uf" className="h-9 bg-background border-input">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão Cadastrar */}
          <div className="flex justify-start pt-2">
            <Button 
              type="submit" 
              className="bg-black hover:bg-black/80 text-white px-10 h-10 text-sm font-semibold rounded"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
