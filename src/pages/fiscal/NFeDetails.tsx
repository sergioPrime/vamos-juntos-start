import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Mail,
  Edit,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NFeCCeHistory from "@/components/fiscal/NFeCCeHistory";

interface NFe {
  id: string;
  numero: number;
  serie: string;
  modelo: string;
  chave_acesso: string | null;
  status: "rascunho" | "pendente" | "autorizada" | "rejeitada" | "cancelada";
  data_emissao: string;
  data_autorizacao: string | null;
  protocolo_autorizacao: string | null;
  natureza_operacao: string;
  destinatario_nome: string;
  destinatario_documento: string;
  destinatario_endereco: string | null;
  destinatario_cidade: string | null;
  destinatario_uf: string | null;
  valor_total_produtos: number;
  valor_total_nota: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_total_ibs: number;
  valor_total_cbs: number;
  valor_total_is: number;
  informacoes_complementares: string | null;
  justificativa_cancelamento: string | null;
  data_cancelamento: string | null;
  companies: {
    name: string;
    document: string;
  };
}

export default function NFeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nfe, setNfe] = useState<NFe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadNFeDetails();
    }
  }, [id]);

  const loadNFeDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_nfe')
        .select('*, companies(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setNfe(data as any);
    } catch (error) {
      console.error('Error loading NFe:', error);
      toast.error("Erro ao carregar detalhes da NFe");
      navigate('/fiscal/nfe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: NFe["status"]) => {
    const variants = {
      rascunho: "secondary",
      pendente: "secondary",
      autorizada: "default",
      rejeitada: "destructive",
      cancelada: "destructive",
    };

    const labels = {
      rascunho: "Rascunho",
      pendente: "Pendente",
      autorizada: "Autorizada",
      rejeitada: "Rejeitada",
      cancelada: "Cancelada",
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const handleDownloadDANFE = async () => {
    if (!nfe) return;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-danfe', {
        body: { nfeId: nfe.id }
      });

      if (error) throw error;

      const blob = new Blob([data.html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${nfe.numero}-${nfe.serie}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("DANFE baixado com sucesso");
    } catch (error) {
      console.error('Error downloading DANFE:', error);
      toast.error("Erro ao baixar DANFE");
    }
  };

  const handlePrint = async () => {
    if (!nfe) return;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-danfe', {
        body: { nfeId: nfe.id }
      });

      if (error) throw error;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast.success("DANFE preparado para impressão");
    } catch (error) {
      console.error('Error printing DANFE:', error);
      toast.error("Erro ao imprimir DANFE");
    }
  };

  if (loading) {
    return (
      <div className="container-comfortable flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!nfe) {
    return null;
  }

  return (
    <div className="container-comfortable">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/fiscal/nfe')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="title-xl flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                NFe #{nfe.numero} - Série {nfe.serie}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(nfe.status)}
                <span className="text-sm text-muted-foreground">
                  Emitida em {formatDate(nfe.data_emissao)}
                </span>
              </div>
            </div>
          </div>

          {nfe.status === 'autorizada' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDANFE}
              >
                <Download className="h-4 w-4 mr-2" />
                Download DANFE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="geral" className="w-full">
          <TabsList>
            <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
            <TabsTrigger value="destinatario">Destinatário</TabsTrigger>
            <TabsTrigger value="totais">Totais e Tributos</TabsTrigger>
            <TabsTrigger value="correcoes">Correções</TabsTrigger>
          </TabsList>

          {/* Dados Gerais */}
          <TabsContent value="geral" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Identificação da NFe</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{nfe.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="font-medium">{nfe.serie}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{nfe.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(nfe.status)}
                </div>
              </div>

              {nfe.chave_acesso && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Chave de Acesso</p>
                    <p className="font-mono text-sm break-all">{nfe.chave_acesso}</p>
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Natureza da Operação</p>
                  <p className="font-medium">{nfe.natureza_operacao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(nfe.data_emissao)}</p>
                </div>
                {nfe.data_autorizacao && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Autorização</p>
                      <p className="font-medium">{formatDate(nfe.data_autorizacao)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protocolo de Autorização</p>
                      <p className="font-mono text-sm">{nfe.protocolo_autorizacao}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Emitente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{nfe.companies?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{nfe.companies?.document || '-'}</p>
                </div>
              </div>
            </Card>

            {nfe.informacoes_complementares && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Informações Complementares</h3>
                <p className="text-sm whitespace-pre-wrap">{nfe.informacoes_complementares}</p>
              </Card>
            )}

            {nfe.status === 'cancelada' && nfe.justificativa_cancelamento && (
              <Card className="p-6 border-destructive">
                <h3 className="font-semibold mb-4 text-destructive">Cancelamento</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Cancelamento</p>
                    <p className="font-medium">{formatDate(nfe.data_cancelamento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Justificativa</p>
                    <p className="text-sm">{nfe.justificativa_cancelamento}</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Destinatário */}
          <TabsContent value="destinatario">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Dados do Destinatário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome/Razão Social</p>
                  <p className="font-medium">{nfe.destinatario_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{nfe.destinatario_documento}</p>
                </div>
                {nfe.destinatario_endereco && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{nfe.destinatario_endereco}</p>
                  </div>
                )}
                {nfe.destinatario_cidade && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade</p>
                    <p className="font-medium">{nfe.destinatario_cidade}</p>
                  </div>
                )}
                {nfe.destinatario_uf && (
                  <div>
                    <p className="text-sm text-muted-foreground">UF</p>
                    <p className="font-medium">{nfe.destinatario_uf}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Totais e Tributos */}
          <TabsContent value="totais" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Valores dos Produtos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total dos Produtos</p>
                  <p className="font-bold text-lg">{formatCurrency(nfe.valor_total_produtos)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Tributos Tradicionais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ICMS</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_icms)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IPI</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_ipi)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PIS</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_pis)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">COFINS</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_cofins)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Novos Tributos (Reforma 2026)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">IBS Total</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_total_ibs)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CBS</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_total_cbs)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IS (Seletivo)</p>
                  <p className="font-medium">{formatCurrency(nfe.valor_total_is)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-primary/5 border-primary">
              <h3 className="font-semibold mb-4">Valor Total da NFe</h3>
              <p className="text-3xl font-bold">{formatCurrency(nfe.valor_total_nota)}</p>
            </Card>
          </TabsContent>

          {/* Correções */}
          <TabsContent value="correcoes">
            <NFeCCeHistory 
              nfeId={nfe.id}
              chaveAcesso={nfe.chave_acesso || ''}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
