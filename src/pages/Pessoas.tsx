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
import { X, Plus, User, Search, ArrowLeft, Save, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import styles from "./Pessoas.module.css"
import { PessoasListagem } from "@/components/pessoas/PessoasListagem"
import { usePessoas, type Pessoa } from "@/hooks/usePessoas"
import { useOrganization } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { useMask } from "@/hooks/useMask"
import { useViaCep } from "@/hooks/useViaCep"

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
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
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
  const [activeTab, setActiveTab] = useState("listagem")
  const [editingPessoa, setEditingPessoa] = useState<Pessoa | null>(null)
  const { createPessoa, updatePessoa } = usePessoas()
  const { currentOrg: currentOrganization } = useOrganization()
  const { user } = useAuth()
  const { detectDocumentType, detectPhoneType } = useMask()
  const { searchCep, loading: cepLoading } = useViaCep()
  
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
    rotulos: [],
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: ""
  })

  const [newEmailSecundario, setNewEmailSecundario] = useState("")
  const [newWhatsapp, setNewWhatsapp] = useState("")

  // Detectar tipo de máscara dinamicamente
  const documentMask = formData.documento ? detectDocumentType(formData.documento) : (formData.tipoPessoa === 'juridica' ? 'cnpj' : 'cpf')
  const phoneMask = formData.telefone ? detectPhoneType(formData.telefone) : 'phone'
  const mobileMask = formData.telefonecelular ? detectPhoneType(formData.telefonecelular) : 'mobile'
  const whatsappMask = newWhatsapp ? detectPhoneType(newWhatsapp) : 'mobile'

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

  const handleCepSearch = async () => {
    if (!formData.cep) {
      toast.error('Digite um CEP para buscar')
      return
    }
    
    const result = await searchCep(formData.cep)
    if (result) {
      setFormData(prev => ({
        ...prev,
        logradouro: result.logradouro,
        bairro: result.bairro,
        cidade: result.localidade,
        uf: result.uf,
        complemento: result.complemento || prev.complemento
      }))
    }
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

  const handleSave = async () => {
    const errors = validateForm()
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    if (!user || !currentOrganization) {
      toast.error("Usuário não autenticado")
      return
    }
    
    try {
      const pessoaData = {
        nome_fantasia: formData.nomeFantasia,
        razao_social: formData.razaoSocial || undefined,
        tipo_pessoa: formData.tipoPessoa as 'fisica' | 'juridica',
        documento: formData.documento,
        codigo: undefined,
        endereco: formData.logradouro ? `${formData.logradouro}${formData.numero ? ', ' + formData.numero : ''}${formData.complemento ? ' - ' + formData.complemento : ''}${formData.bairro ? ' - ' + formData.bairro : ''}` : undefined,
        cidade: formData.cidade || undefined,
        uf: formData.uf || undefined,
        cep: formData.cep ? formData.cep.replace(/\D/g, '') : undefined,
        email_geral: formData.emailGeral || undefined,
        emails_secundarios: formData.emailsSecundarios.length > 0 ? formData.emailsSecundarios : undefined,
        telefone: formData.telefone || undefined,
        telefone_celular: formData.telefonecelular || undefined,
        whatsapps: formData.whatsapps.length > 0 ? formData.whatsapps : undefined,
        bloquear_notificacoes_whatsapp: formData.bloquearNotificacoesWhatsapp,
        vendedor_padrao: formData.vendedorPadrao || undefined,
        transportadora_padrao: formData.transportadoraPadrao || undefined,
        rotulos: formData.rotulos.length > 0 ? formData.rotulos : undefined,
        ativo: true,
        org_id: currentOrganization.id,
        created_by: user.id
      }

      if (editingPessoa && editingPessoa.id) {
        await updatePessoa(editingPessoa.id, pessoaData)
        toast.success("Pessoa atualizada com sucesso!")
      } else {
        await createPessoa(pessoaData)
        toast.success("Pessoa cadastrada com sucesso!")
      }

      // Reset form and go back to listing
      setFormData({
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
        rotulos: [],
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: ""
      })
      setEditingPessoa(null)
      setActiveTab("listagem")
    } catch (error) {
      toast.error("Erro ao salvar pessoa")
      console.error(error)
    }
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

  const handleEditPessoa = (pessoa: Pessoa) => {
    if (pessoa.id) {
      // Editing existing pessoa
      setEditingPessoa(pessoa)
      setFormData({
        nomeFantasia: pessoa.nome_fantasia,
        tipoPessoa: pessoa.tipo_pessoa,
        documento: pessoa.documento,
        razaoSocial: pessoa.razao_social || "",
        emailGeral: pessoa.email_geral || "",
        emailsSecundarios: pessoa.emails_secundarios || [],
        telefone: pessoa.telefone || "",
        telefonecelular: pessoa.telefone_celular || "",
        whatsapps: pessoa.whatsapps || [],
        bloquearNotificacoesWhatsapp: pessoa.bloquear_notificacoes_whatsapp || false,
        vendedorPadrao: pessoa.vendedor_padrao || "",
        transportadoraPadrao: pessoa.transportadora_padrao || "",
        rotulos: pessoa.rotulos || [],
        cep: pessoa.cep || "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: pessoa.cidade || "",
        uf: pessoa.uf || ""
      })
    } else {
      // Creating new pessoa
      setEditingPessoa(null)
      setFormData({
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
        rotulos: [],
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: ""
      })
    }
    setActiveTab("dados")
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header com breadcrumb */}
      <div className={styles.pessoaHeader}>
        <div className={styles.pessoaBreadcrumb}>
          <span>Cadastro &gt;</span>
        </div>
        <h1 className={styles.pessoaTitle}>
          <div className={styles.pessoaIcon}>
            <User className="w-4 h-4" />
          </div>
          Pessoas - {formData.nomeFantasia || (editingPessoa ? "Editar Pessoa" : "Nova Pessoa")}
        </h1>
      </div>

      {/* Barra de ações */}
      <div className="flex justify-end items-center px-6 py-4 bg-white border-b" style={{ borderColor: '#EEEEEE' }}>
        <div className={styles.actionsBar}>
          <button className={styles.btnFeedback}>
            <MessageSquare className="inline-block mr-2 w-4 h-4" />
            Enviar Feedback
          </button>
          <button className={styles.btnSave} onClick={handleSave}>
            <Save className="inline-block mr-2 w-4 h-4" />
            Salvar
          </button>
          <button className={styles.btnBack} onClick={handleBack}>
            <ArrowLeft className="inline-block mr-2 w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {activeTab === "listagem" ? (
            <PessoasListagem onEditPessoa={handleEditPessoa} />
          ) : (
            <>
              {/* Tabs customizadas */}
              <div className="mb-6">
                <div className="border-b" style={{ borderColor: '#EEEEEE' }}>
                <div className="flex">
                  <button 
                    type="button"
                    className={`${styles.tabTrigger} ${styles.tabTriggerActive}`}
                  >
                    Dados
                  </button>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className={styles.formContainer}>
              {/* Primeira linha - Nome Fantasia, Tipo de Pessoa e CPF */}
              <div className={styles.formGrid}>
                <div>
                  <label htmlFor="nomeFantasia" className={styles.formLabel}>
                    Nome Fantasia <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <Input
                    id="nomeFantasia"
                    type="text"
                    className={styles.formInput}
                    value={formData.nomeFantasia}
                    onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                    placeholder="Nome fantasia da pessoa"
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="tipoPessoa" className={styles.formLabel}>
                    Tipo de Pessoa <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <Select 
                    value={formData.tipoPessoa} 
                    onValueChange={(value) => handleInputChange("tipoPessoa", value)}
                  >
                    <SelectTrigger className={styles.formSelect}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="documento" className={styles.formLabel}>
                    {getDocumentLabel()}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="documento"
                      type="text"
                      className={styles.formInput}
                      value={formData.documento}
                      onChange={(e) => handleInputChange("documento", e.target.value)}
                      mask={documentMask}
                      validateDocument={true}
                    />
                    <button 
                      type="button" 
                      className={styles.searchButton}
                      title="Buscar CPF/CNPJ"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Segunda linha - E-mail Geral, E-mails Secundários e Telefone */}
              <div className={styles.formGrid}>
                <div>
                  <label htmlFor="emailGeral" className={styles.formLabel}>
                    E-mail Geral
                  </label>
                  <input
                    id="emailGeral"
                    type="email"
                    className={styles.formInput}
                    value={formData.emailGeral}
                    onChange={(e) => handleInputChange("emailGeral", e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    E-mail Secundários (Tecle enter para adicionar o e-mail)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      className={styles.formInput}
                      value={newEmailSecundario}
                      onChange={(e) => setNewEmailSecundario(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, () => addEmailSecundario(newEmailSecundario))}
                      placeholder="adicionar@email.com"
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
                  {formData.emailsSecundarios.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                  )}
                </div>

                <div>
                  <label htmlFor="telefone" className={styles.formLabel}>
                    Telefone
                  </label>
                  <Input
                    id="telefone"
                    type="text"
                    className={styles.formInput}
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    mask={phoneMask}
                  />
                </div>
              </div>

              {/* Terceira linha - WhatsApp, Telefone Celular */}
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.formLabel}>
                    Whatsapp (Tecle enter para adicionar o whatsapp)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      className={styles.formInput}
                      value={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, () => addWhatsapp(newWhatsapp))}
                      mask={whatsappMask}
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
                  {formData.whatsapps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                  )}
                </div>

                <div>
                  <label htmlFor="telefonecelular" className={styles.formLabel}>
                    Telefone Celular
                  </label>
                  <Input
                    id="telefonecelular"
                    type="text"
                    className={styles.formInput}
                    value={formData.telefonecelular}
                    onChange={(e) => handleInputChange("telefonecelular", e.target.value)}
                    mask={mobileMask}
                  />
                </div>
              </div>

              {/* Quarta linha - CEP, Logradouro, Número */}
              <div className={styles.formGrid}>
                <div>
                  <label htmlFor="cep" className={styles.formLabel}>
                    CEP
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cep"
                      type="text"
                      className={styles.formInput}
                      value={formData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                      mask="cep"
                    />
                    <button 
                      type="button" 
                      className={styles.searchButton}
                      onClick={handleCepSearch}
                      disabled={cepLoading}
                      title="Buscar CEP"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="logradouro" className={styles.formLabel}>
                    Logradouro
                  </label>
                  <Input
                    id="logradouro"
                    type="text"
                    className={styles.formInput}
                    value={formData.logradouro}
                    onChange={(e) => handleInputChange("logradouro", e.target.value)}
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="numero" className={styles.formLabel}>
                    Número
                  </label>
                  <Input
                    id="numero"
                    type="text"
                    className={styles.formInput}
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                  />
                </div>
              </div>

              {/* Quinta linha - Complemento, Bairro, Cidade, UF */}
              <div className={styles.formGrid}>
                <div>
                  <label htmlFor="complemento" className={styles.formLabel}>
                    Complemento
                  </label>
                  <Input
                    id="complemento"
                    type="text"
                    className={styles.formInput}
                    value={formData.complemento}
                    onChange={(e) => handleInputChange("complemento", e.target.value)}
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="bairro" className={styles.formLabel}>
                    Bairro
                  </label>
                  <Input
                    id="bairro"
                    type="text"
                    className={styles.formInput}
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="cidade" className={styles.formLabel}>
                    Cidade
                  </label>
                  <Input
                    id="cidade"
                    type="text"
                    className={styles.formInput}
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="uf" className={styles.formLabel}>
                    UF
                  </label>
                  <Select 
                    value={formData.uf} 
                    onValueChange={(value) => handleInputChange("uf", value)}
                  >
                    <SelectTrigger className={styles.formSelect}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
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

              {/* Sexta linha - Vendedor Padrão e Transportadora Padrão */}
              <div className={styles.formGrid2Col}>
                <div>
                  <label htmlFor="vendedorPadrao" className={styles.formLabel}>
                    Vendedor Padrão
                  </label>
                  <Input
                    id="vendedorPadrao"
                    type="text"
                    className={styles.formInput}
                    value={formData.vendedorPadrao}
                    onChange={(e) => handleInputChange("vendedorPadrao", e.target.value)}
                    placeholder="Nome do vendedor"
                    uppercase
                    blockSpecialChars
                  />
                </div>

                <div>
                  <label htmlFor="transportadoraPadrao" className={styles.formLabel}>
                    Transportadora Padrão
                  </label>
                  <Input
                    id="transportadoraPadrao"
                    type="text"
                    className={styles.formInput}
                    value={formData.transportadoraPadrao}
                    onChange={(e) => handleInputChange("transportadoraPadrao", e.target.value)}
                    placeholder="Nome da transportadora"
                    uppercase
                    blockSpecialChars
                  />
                </div>
              </div>

              {/* Switch - Bloquear notificações WhatsApp */}
              <div className={styles.switchContainer}>
                <Switch
                  id="bloquearNotificacoes"
                  checked={formData.bloquearNotificacoesWhatsapp}
                  onCheckedChange={(checked) => handleInputChange("bloquearNotificacoesWhatsapp", checked)}
                />
                <label htmlFor="bloquearNotificacoes" className={styles.switchLabel}>
                  Bloquear notificações de cobrança por Whatsapp
                </label>
              </div>

              {/* Switch - Cadastro Inativo */}
              <div className={styles.switchContainer}>
                <Switch
                  id="cadastroInativo"
                  checked={false}
                  onCheckedChange={() => {}}
                />
                <label htmlFor="cadastroInativo" className={styles.switchLabel}>
                  Cadastro Inativo
                </label>
              </div>

              {/* Rótulos */}
              <div className="mt-6">
                <label className={styles.formLabel}>
                  Rótulo (Relação que esta pessoa terá com a empresa)
                </label>
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
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}