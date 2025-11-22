import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Loader2, 
  Calendar, 
  DollarSign, 
  User, 
  Building,
  Hash,
  Clock,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NFeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
}

export default function NFeDetailsDialog({
  open,
  onOpenChange,
  nfeId,
}: NFeDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [nfeData, setNfeData] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    if (open && nfeId) {
      loadNFeDetails();
    }
  }, [open, nfeId]);

  const loadNFeDetails = async () => {
    setLoading(true);
    try {
      // Buscar dados da NFe
      const { data: nfe, error: nfeError } = await supabase
        .from('nfe')
        .select(`
          *,
          fiscal_config!inner(
            razao_social,
            cnpj,
            inscricao_estadual
          )
        `)
        .eq('id', nfeId)
        .single();

      if (nfeError) throw nfeError;

      // Buscar eventos relacionados
      const { data: eventosData, error: eventosError } = await supabase
        .from('nfe_eventos')
        .select('*')
        .eq('nfe_id', nfeId)
        .order('data_evento', { ascending: false });

      if (eventosError) throw eventosError;

      setNfeData(nfe);
      setEventos(eventosData || []);
    } catch (error: any) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da NFe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "autorizada":
        return "default";
      case "cancelada":
        return "destructive";
      case "pendente":
        return "secondary";
      case "rejeitada":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEventoIcon = (tipo: string) => {
    switch (tipo) {
      case "cancelamento":
        return "❌";
      case "carta_correcao":
        return "📝";
      case "manifestacao":
        return "✅";
      case "envio_email":
        return "📧";
      default:
        return "📄";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!nfeData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>NFe não encontrada</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da NFe {nfeData.numero}
          </DialogTitle>
          <DialogDescription>
            Série {nfeData.serie} • Chave: {nfeData.chave_acesso}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="valores">Valores</TabsTrigger>
            <TabsTrigger value="eventos">
              Eventos ({eventos.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="geral" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusBadgeVariant(nfeData.status) as any}>
                    {nfeData.status.toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span>Número</span>
                    </div>
                    <p className="text-sm font-medium">{nfeData.numero}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Data Emissão</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(nfeData.data_emissao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>Emitente</span>
                    </div>
                    <p className="text-sm font-medium">
                      {nfeData.fiscal_config.razao_social}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {nfeData.fiscal_config.cnpj}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Destinatário</span>
                    </div>
                    <p className="text-sm font-medium">
                      {nfeData.destinatario_nome || 'Não informado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nfeData.destinatario_documento || '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Informações de Protocolo</span>
                  </div>
                  {nfeData.protocolo_autorizacao && (
                    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                      <p className="text-xs">
                        <strong>Protocolo:</strong> {nfeData.protocolo_autorizacao}
                      </p>
                      {nfeData.data_autorizacao && (
                        <p className="text-xs">
                          <strong>Autorizado em:</strong>{' '}
                          {new Date(nfeData.data_autorizacao).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="valores" className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Valor Produtos</span>
                    </div>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(nfeData.valor_produtos || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Valor Total</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(nfeData.valor_total || 0)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tributos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">ICMS</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_icms || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">IPI</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_ipi || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">PIS</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_pis || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">COFINS</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_cofins || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Outros Valores</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Frete</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_frete || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Seguro</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_seguro || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Desconto</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_desconto || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Outras Despesas</p>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(nfeData.valor_outras_despesas || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="eventos" className="space-y-3">
              {eventos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum evento registrado</p>
                </div>
              ) : (
                eventos.map((evento) => (
                  <div
                    key={evento.id}
                    className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getEventoIcon(evento.tipo_evento)}</span>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {evento.tipo_evento.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <p className="text-sm font-medium">{evento.descricao}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(evento.data_evento).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {evento.protocolo && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Protocolo: {evento.protocolo}
                      </p>
                    )}
                    {evento.numero_sequencial && (
                      <p className="text-xs text-muted-foreground">
                        Sequencial: {evento.numero_sequencial}
                      </p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
