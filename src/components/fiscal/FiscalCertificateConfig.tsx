import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FiscalCertificateConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["fiscal-config"],
    queryFn: async () => {
      const { data: orgData } = await supabase
        .from("user_organizations")
        .select("org_id")
        .single();

      if (!orgData) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("fiscal_config")
        .select("*")
        .eq("org_id", orgData.org_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Mutation to save configuration
  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: orgData } = await supabase
        .from("user_organizations")
        .select("org_id")
        .single();

      if (!orgData) throw new Error("Organização não encontrada");

      // Upload certificate if provided
      let certificateData = null;
      if (certificateFile) {
        const arrayBuffer = await certificateFile.arrayBuffer();
        certificateData = Array.from(new Uint8Array(arrayBuffer));
      }

      const configData = {
        org_id: orgData.org_id,
        certificate_pfx: certificateData,
        certificate_password_encrypted: formData.get("certificate_password") as string,
        ambiente: formData.get("ambiente") as string,
        uf: formData.get("uf") as string,
        serie_nfe: formData.get("serie_nfe") as string,
        proximo_numero_nfe: parseInt(formData.get("proximo_numero_nfe") as string),
        razao_social: formData.get("razao_social") as string,
        nome_fantasia: formData.get("nome_fantasia") as string,
        cnpj: formData.get("cnpj") as string,
        inscricao_estadual: formData.get("inscricao_estadual") as string,
        inscricao_municipal: formData.get("inscricao_municipal") as string,
        regime_tributario: formData.get("regime_tributario") as string,
        logradouro: formData.get("logradouro") as string,
        numero: formData.get("numero") as string,
        complemento: formData.get("complemento") as string,
        bairro: formData.get("bairro") as string,
        codigo_municipio: formData.get("codigo_municipio") as string,
        municipio: formData.get("municipio") as string,
        uf_emitente: formData.get("uf_emitente") as string,
        cep: formData.get("cep") as string,
        telefone: formData.get("telefone") as string,
        email: formData.get("email") as string,
      };

      if (config?.id) {
        const { error } = await supabase
          .from("fiscal_config")
          .update(configData)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fiscal_config")
          .insert(configData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-config"] });
      toast({
        title: "Configuração salva",
        description: "As configurações fiscais foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Certificado Digital
          </CardTitle>
          <CardDescription>
            Configure o certificado digital A1 (.pfx) para assinar as NFe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O certificado digital é obrigatório para emitir NFe em ambiente de produção.
              Utilize certificado A1 no formato .pfx ou .p12
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="certificate">Arquivo do Certificado (.pfx)</Label>
            <div className="flex gap-2">
              <Input
                id="certificate"
                type="file"
                accept=".pfx,.p12"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
              {config?.certificate_pfx && (
                <span className="text-sm text-muted-foreground flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Certificado configurado
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_password">Senha do Certificado</Label>
            <Input
              id="certificate_password"
              name="certificate_password"
              type="password"
              placeholder="Digite a senha do certificado"
              defaultValue={config?.certificate_password_encrypted || ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente</Label>
              <Select name="ambiente" defaultValue={config?.ambiente || "homologacao"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                name="uf"
                maxLength={2}
                placeholder="SP"
                defaultValue={config?.uf || ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie_nfe">Série NFe</Label>
              <Input
                id="serie_nfe"
                name="serie_nfe"
                placeholder="1"
                defaultValue={config?.serie_nfe || "1"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximo_numero_nfe">Próximo Número</Label>
              <Input
                id="proximo_numero_nfe"
                name="proximo_numero_nfe"
                type="number"
                min="1"
                defaultValue={config?.proximo_numero_nfe || 1}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Emitente</CardTitle>
          <CardDescription>
            Informações da empresa que serão utilizadas na NFe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                name="razao_social"
                defaultValue={config?.razao_social || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                name="nome_fantasia"
                defaultValue={config?.nome_fantasia || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                defaultValue={config?.cnpj || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                name="inscricao_estadual"
                defaultValue={config?.inscricao_estadual || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                name="inscricao_municipal"
                defaultValue={config?.inscricao_municipal || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regime_tributario">Regime Tributário</Label>
            <Select name="regime_tributario" defaultValue={config?.regime_tributario || "1"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Simples Nacional</SelectItem>
                <SelectItem value="2">Simples Nacional - Excesso</SelectItem>
                <SelectItem value="3">Regime Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                name="logradouro"
                defaultValue={config?.logradouro || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                name="numero"
                defaultValue={config?.numero || ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                name="complemento"
                defaultValue={config?.complemento || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                name="bairro"
                defaultValue={config?.bairro || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                name="cep"
                defaultValue={config?.cep || ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_municipio">Código Município</Label>
              <Input
                id="codigo_municipio"
                name="codigo_municipio"
                placeholder="3550308"
                defaultValue={config?.codigo_municipio || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              <Input
                id="municipio"
                name="municipio"
                defaultValue={config?.municipio || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf_emitente">UF</Label>
              <Input
                id="uf_emitente"
                name="uf_emitente"
                maxLength={2}
                defaultValue={config?.uf_emitente || ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={config?.telefone || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={config?.email || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </form>
  );
}