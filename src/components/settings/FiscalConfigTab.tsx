import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useFiscalConfig } from "@/hooks/useFiscalConfig"
import { FileUp, Shield, AlertCircle, CheckCircle2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function FiscalConfigTab() {
  const { config, loading, saveConfig, uploadCertificate } = useFiscalConfig()
  const { toast } = useToast()
  const [formData, setFormData] = useState(config || {})
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const success = await saveConfig(formData)
    if (success) {
      setFormData(prev => ({ ...prev, ...config }))
    }
  }

  const handleCertificateUpload = async () => {
    if (!certificateFile || !certificatePassword) {
      toast({
        title: "Dados incompletos",
        description: "Selecione o arquivo .pfx e informe a senha.",
        variant: "destructive",
      })
      return
    }

    const success = await uploadCertificate(certificateFile, certificatePassword)
    if (success) {
      setCertificateFile(null)
      setCertificatePassword('')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>
  }

  const certificateExpired = config?.certificate_expires_at 
    ? new Date(config.certificate_expires_at) < new Date()
    : false

  return (
    <div className="space-y-6">
      <Tabs defaultValue="emitente" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="emitente">Emitente</TabsTrigger>
          <TabsTrigger value="certificado">Certificado</TabsTrigger>
          <TabsTrigger value="csc">CSC</TabsTrigger>
          <TabsTrigger value="notas">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="contingencia">Contingência</TabsTrigger>
        </TabsList>

        {/* Tab Emitente */}
        <TabsContent value="emitente" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Emitente</CardTitle>
              <CardDescription>
                Configure os dados da sua empresa para emissão de documentos fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input
                    value={formData.cnpj || ''}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual *</Label>
                  <Input
                    value={formData.inscricao_estadual || ''}
                    onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social *</Label>
                  <Input
                    value={formData.razao_social || ''}
                    onChange={(e) => handleInputChange('razao_social', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.nome_fantasia || ''}
                    onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Regime Tributário *</Label>
                <Select
                  value={formData.regime_tributario || ''}
                  onValueChange={(value) => handleInputChange('regime_tributario', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Simples Nacional</SelectItem>
                    <SelectItem value="2">Simples Nacional - Excesso</SelectItem>
                    <SelectItem value="3">Regime Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Endereço</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Logradouro *</Label>
                    <Input
                      value={formData.logradouro || ''}
                      onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input
                      value={formData.numero || ''}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input
                      value={formData.complemento || ''}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro *</Label>
                    <Input
                      value={formData.bairro || ''}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Município *</Label>
                    <Input
                      value={formData.municipio || ''}
                      onChange={(e) => handleInputChange('municipio', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF *</Label>
                    <Input
                      value={formData.uf || ''}
                      onChange={(e) => handleInputChange('uf', e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP *</Label>
                    <Input
                      value={formData.cep || ''}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Certificado */}
        <TabsContent value="certificado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificado Digital A1
              </CardTitle>
              <CardDescription>
                Faça upload do certificado digital para assinatura de documentos fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.certificate_pfx ? (
                <Alert className={certificateExpired ? "border-destructive" : "border-primary"}>
                  {certificateExpired ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {certificateExpired ? "Certificado Expirado" : "Certificado Instalado"}
                        </p>
                        <p className="text-sm">
                          Validade: {config.certificate_expires_at 
                            ? new Date(config.certificate_expires_at).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <Badge variant={certificateExpired ? "destructive" : "default"}>
                        {certificateExpired ? "Expirado" : "Ativo"}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum certificado digital instalado. Faça o upload para habilitar emissão de NF-e/NFC-e.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Arquivo .pfx ou .p12</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Senha do Certificado</Label>
                  <Input
                    type="password"
                    value={certificatePassword}
                    onChange={(e) => setCertificatePassword(e.target.value)}
                    placeholder="Digite a senha do certificado"
                  />
                </div>

                <Button 
                  onClick={handleCertificateUpload}
                  disabled={!certificateFile || !certificatePassword}
                  className="w-full"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Fazer Upload do Certificado
                </Button>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Importante:</strong> O certificado digital é necessário para assinar
                  documentos fiscais eletrônicos (NF-e, NFC-e, NFS-e). Certifique-se de que o
                  certificado está válido e pertence ao CNPJ cadastrado.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab CSC */}
        <TabsContent value="csc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSC - Código de Segurança do Contribuinte</CardTitle>
              <CardDescription>
                Configure os códigos CSC para NFC-e (obrigatório)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Ambiente de Produção</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID do CSC</Label>
                    <Input
                      value={formData.csc_id_producao || ''}
                      onChange={(e) => handleInputChange('csc_id_producao', e.target.value)}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CSC</Label>
                    <Input
                      type="password"
                      value={formData.csc_producao || ''}
                      onChange={(e) => handleInputChange('csc_producao', e.target.value)}
                      placeholder="Código fornecido pela SEFAZ"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Ambiente de Homologação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID do CSC</Label>
                    <Input
                      value={formData.csc_id_homologacao || ''}
                      onChange={(e) => handleInputChange('csc_id_homologacao', e.target.value)}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CSC</Label>
                    <Input
                      type="password"
                      value={formData.csc_homologacao || ''}
                      onChange={(e) => handleInputChange('csc_homologacao', e.target.value)}
                      placeholder="Código fornecido pela SEFAZ"
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Como obter o CSC:</strong> Acesse o portal da SEFAZ do seu estado,
                  vá em "Gerenciar CSC" e solicite um novo código. O CSC é necessário para
                  emissão de NFC-e.
                </AlertDescription>
              </Alert>

              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar CSC
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notas Fiscais */}
        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notas Fiscais</CardTitle>
              <CardDescription>
                Configure séries e numeração das notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Ambiente de Emissão</Label>
                <Select
                  value={formData.ambiente || 'homologacao'}
                  onValueChange={(value) => handleInputChange('ambiente', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">NF-e (Nota Fiscal Eletrônica)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Série</Label>
                    <Input
                      value={formData.serie_nfe || ''}
                      onChange={(e) => handleInputChange('serie_nfe', e.target.value)}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Próximo Número</Label>
                    <Input
                      type="number"
                      value={formData.proximo_numero_nfe || ''}
                      onChange={(e) => handleInputChange('proximo_numero_nfe', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">NFC-e (Nota Fiscal ao Consumidor)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Série</Label>
                    <Input
                      value={formData.serie_nfce || ''}
                      onChange={(e) => handleInputChange('serie_nfce', e.target.value)}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Próximo Número</Label>
                    <Input
                      type="number"
                      value={formData.proximo_numero_nfce || ''}
                      onChange={(e) => handleInputChange('proximo_numero_nfce', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">NFS-e (Nota Fiscal de Serviço)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Série</Label>
                    <Input
                      value={formData.serie_nfse || ''}
                      onChange={(e) => handleInputChange('serie_nfse', e.target.value)}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Próximo Número</Label>
                    <Input
                      type="number"
                      value={formData.proximo_numero_nfse || ''}
                      onChange={(e) => handleInputChange('proximo_numero_nfse', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contingência */}
        <TabsContent value="contingencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modo de Contingência</CardTitle>
              <CardDescription>
                Configure o modo de contingência para emissão offline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Ativar Modo de Contingência</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite emissão de notas quando a SEFAZ estiver indisponível
                  </p>
                </div>
                <Switch
                  checked={formData.contingencia_ativa || false}
                  onCheckedChange={(checked) => handleInputChange('contingencia_ativa', checked)}
                />
              </div>

              {formData.contingencia_ativa && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Motivo da Contingência</Label>
                      <Input
                        value={formData.motivo_contingencia || ''}
                        onChange={(e) => handleInputChange('motivo_contingencia', e.target.value)}
                        placeholder="Ex: Indisponibilidade da SEFAZ"
                      />
                    </div>

                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Atenção:</strong> O modo de contingência deve ser usado apenas
                        quando houver problemas de comunicação com a SEFAZ. As notas emitidas
                        em contingência devem ser transmitidas posteriormente.
                      </AlertDescription>
                    </Alert>
                  </div>
                </>
              )}

              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
