import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface PessoaFormData {
  nomeFantasia: string
  tipoPessoa: "fisica" | "juridica" | ""
  documento: string
  razaoSocial: string
  emailGeral: string
  emailsSecundarios: string[]
  telefone: string
  telefonecelular: string
  whatsapps: string[]
  bloquearNotificacoesWhatsapp: boolean
  vendedorPadrao: string
  transportadoraPadrao: string
  rotulos: string[]
}

const rotulosDisponiveis = [
  "Cliente",
  "Transportadora", 
  "Técnico",
  "Fornecedor",
  "Colaborador",
  "Representada",
  "Vendedor",
  "Credenciada",
  "Fabricante"
]

export function Pessoas() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dados")
  const [formData, setFormData] = useState<PessoaFormData>({
    nomeFantasia: "",
    tipoPessoa: "",
    documento: "",
    razaoSocial: "",
    emailGeral: "",
    emailsSecundarios: [],
    telefone: "",
    telefonecelular: "",
    whatsapps: [],
    bloquearNotificacoesWhatsapp: false,
    vendedorPadrao: "",
    transportadoraPadrao: "",
    rotulos: []
  })

  const [newEmailSecundario, setNewEmailSecundario] = useState("")
  const [newWhatsapp, setNewWhatsapp] = useState("")

  const handleInputChange = (field: keyof PessoaFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addEmailSecundario = (email: string) => {
    if (email.trim() && !formData.emailsSecundarios.includes(email.trim())) {
      setFormData(prev => ({
        ...prev,
        emailsSecundarios: [...prev.emailsSecundarios, email.trim()]
      }))
      setNewEmailSecundario("")
    }
  }

  const removeEmailSecundario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emailsSecundarios: prev.emailsSecundarios.filter((_, i) => i !== index)
    }))
  }

  const addWhatsapp = (whatsapp: string) => {
    if (whatsapp.trim() && !formData.whatsapps.includes(whatsapp.trim())) {
      setFormData(prev => ({
        ...prev,
        whatsapps: [...prev.whatsapps, whatsapp.trim()]
      }))
      setNewWhatsapp("")
    }
  }

  const removeWhatsapp = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatsapps: prev.whatsapps.filter((_, i) => i !== index)
    }))
  }

  const toggleRotulo = (rotulo: string) => {
    setFormData(prev => ({
      ...prev,
      rotulos: prev.rotulos.includes(rotulo)
        ? prev.rotulos.filter(r => r !== rotulo)
        : [...prev.rotulos, rotulo]
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      action()
    }
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.nomeFantasia.trim()) {
      errors.push("Nome Fantasia é obrigatório")
    }
    
    if (!formData.tipoPessoa) {
      errors.push("Tipo de Pessoa é obrigatório")
    }
    
    if (!formData.documento.trim()) {
      errors.push(formData.tipoPessoa === "fisica" ? "CPF é obrigatório" : "CNPJ é obrigatório")
    }
    
    return errors
  }

  const handleSave = () => {
    const errors = validateForm()
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }
    
    // Aqui seria implementada a lógica de salvamento
    toast.success("Pessoa cadastrada com sucesso!")
    console.log("Dados salvos:", formData)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const getDocumentLabel = () => {
    if (formData.tipoPessoa === "fisica") return "CPF"
    if (formData.tipoPessoa === "juridica") return "CNPJ"
    return "CNPJ/CPF"
  }

  const getDocumentPlaceholder = () => {
    if (formData.tipoPessoa === "fisica") return "000.000.000-00"
    if (formData.tipoPessoa === "juridica") return "00.000.000/0000-00"
    return "Documento"
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header fixo */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">P</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Pessoas - {formData.nomeFantasia || "NOVA PESSOA"}</h1>
              <p className="text-sm text-muted-foreground">Cadastro</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            Voltar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="contatos" disabled className="opacity-50">Contatos</TabsTrigger>
              <TabsTrigger value="negociacoes" disabled className="opacity-50">Negociações Efetuadas</TabsTrigger>
              <TabsTrigger value="registros" disabled className="opacity-50">Registros Financeiros</TabsTrigger>
              <TabsTrigger value="pendencias" disabled className="opacity-50">Pendências</TabsTrigger>
              <TabsTrigger value="referencias" disabled className="opacity-50">Referências</TabsTrigger>
              <TabsTrigger value="arquivos" disabled className="opacity-50">Arquivos</TabsTrigger>
              <TabsTrigger value="imagem" disabled className="opacity-50">Imagem</TabsTrigger>
              <TabsTrigger value="agendamentos" disabled className="opacity-50">Agendamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nome Fantasia */}
                    <div>
                      <Label htmlFor="nomeFantasia" className="required">Nome Fantasia *</Label>
                      <Input
                        id="nomeFantasia"
                        value={formData.nomeFantasia}
                        onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                        placeholder="Nome fantasia da pessoa"
                        className="mt-1"
                      />
                    </div>

                    {/* Tipo de Pessoa */}
                    <div>
                      <Label htmlFor="tipoPessoa" className="required">Tipo de Pessoa *</Label>
                      <Select value={formData.tipoPessoa} onValueChange={(value) => handleInputChange("tipoPessoa", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fisica">Pessoa Física</SelectItem>
                          <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CNPJ/CPF */}
                    <div>
                      <Label htmlFor="documento" className="required">{getDocumentLabel()} *</Label>
                      <Input
                        id="documento"
                        value={formData.documento}
                        onChange={(e) => handleInputChange("documento", e.target.value)}
                        placeholder={getDocumentPlaceholder()}
                        className="mt-1"
                      />
                    </div>

                    {/* Razão Social */}
                    <div>
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input
                        id="razaoSocial"
                        value={formData.razaoSocial}
                        onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                        placeholder="Razão social"
                        className="mt-1"
                      />
                    </div>

                    {/* E-mail Geral */}
                    <div>
                      <Label htmlFor="emailGeral">E-mail Geral</Label>
                      <Input
                        id="emailGeral"
                        type="email"
                        value={formData.emailGeral}
                        onChange={(e) => handleInputChange("emailGeral", e.target.value)}
                        placeholder="email@exemplo.com"
                        className="mt-1"
                      />
                    </div>

                    {/* Telefone */}
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange("telefone", e.target.value)}
                        placeholder="(00) 0000-0000"
                        className="mt-1"
                      />
                    </div>

                    {/* Telefone Celular */}
                    <div>
                      <Label htmlFor="telefonecelular">Telefone Celular</Label>
                      <Input
                        id="telefonecelular"
                        value={formData.telefonecelular}
                        onChange={(e) => handleInputChange("telefonecelular", e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                      />
                    </div>

                    {/* Vendedor Padrão */}
                    <div>
                      <Label htmlFor="vendedorPadrao">Vendedor Padrão</Label>
                      <Input
                        id="vendedorPadrao"
                        value={formData.vendedorPadrao}
                        onChange={(e) => handleInputChange("vendedorPadrao", e.target.value)}
                        placeholder="Nome do vendedor"
                        className="mt-1"
                      />
                    </div>

                    {/* Transportadora Padrão */}
                    <div>
                      <Label htmlFor="transportadoraPadrao">Transportadora Padrão</Label>
                      <Input
                        id="transportadoraPadrao"
                        value={formData.transportadoraPadrao}
                        onChange={(e) => handleInputChange("transportadoraPadrao", e.target.value)}
                        placeholder="Nome da transportadora"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* E-mails Secundários */}
                  <div>
                    <Label>E-mail Secundários</Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newEmailSecundario}
                          onChange={(e) => setNewEmailSecundario(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, () => addEmailSecundario(newEmailSecundario))}
                          placeholder="adicionar@email.com (pressione Enter para adicionar)"
                          type="email"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => addEmailSecundario(newEmailSecundario)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.emailsSecundarios.map((email, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {email}
                            <button
                              onClick={() => removeEmailSecundario(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <Label>WhatsApp</Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newWhatsapp}
                          onChange={(e) => setNewWhatsapp(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, () => addWhatsapp(newWhatsapp))}
                          placeholder="(00) 00000-0000 (pressione Enter para adicionar)"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => addWhatsapp(newWhatsapp)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.whatsapps.map((whatsapp, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {whatsapp}
                            <button
                              onClick={() => removeWhatsapp(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bloquear notificações WhatsApp */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bloquearNotificacoes"
                      checked={formData.bloquearNotificacoesWhatsapp}
                      onCheckedChange={(checked) => handleInputChange("bloquearNotificacoesWhatsapp", checked)}
                    />
                    <Label htmlFor="bloquearNotificacoes">
                      Bloquear notificações de cobrança por WhatsApp
                    </Label>
                  </div>

                  {/* Rótulos */}
                  <div>
                    <Label>Rótulo (Relação que esta pessoa terá com a empresa)</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {rotulosDisponiveis.map((rotulo) => (
                        <div key={rotulo} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`rotulo-${rotulo}`}
                            checked={formData.rotulos.includes(rotulo)}
                            onChange={() => toggleRotulo(rotulo)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`rotulo-${rotulo}`} className="text-sm">
                            {rotulo}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}