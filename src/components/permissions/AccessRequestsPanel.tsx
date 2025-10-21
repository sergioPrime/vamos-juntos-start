import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAccessRequests } from '@/hooks/useAccessRequests';
import { MODULE_INFO, ModuleKey } from '@/constants/permissions';
import { CheckCircle, XCircle, Eye, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AccessRequestsPanel() {
  const { toast } = useToast();
  const { requests, loading, approveRequest, rejectRequest } = useAccessRequests();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const handleReview = async () => {
    if (!selectedRequest || !reviewAction) return;

    setProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await approveRequest(selectedRequest.id, reviewNotes);
        toast({
          title: 'Solicitação aprovada',
          description: 'As permissões foram concedidas ao usuário.',
        });
      } else {
        await rejectRequest(selectedRequest.id, reviewNotes);
        toast({
          title: 'Solicitação rejeitada',
          description: 'O usuário foi notificado sobre a decisão.',
        });
      }

      setSelectedRequest(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível processar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      approved: { variant: 'default', label: 'Aprovado' },
      rejected: { variant: 'destructive', label: 'Rejeitado' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPermissionsText = (permissions: any) => {
    const permList: string[] = [];
    if (permissions.can_read) permList.push('Visualizar');
    if (permissions.can_create) permList.push('Criar');
    if (permissions.can_update) permList.push('Editar');
    if (permissions.can_delete) permList.push('Excluir');
    return permList.join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitações de Acesso</CardTitle>
              <CardDescription>
                Gerencie solicitações de acesso aos módulos do sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">
                            {request.user_email || 'Usuário desconhecido'}
                          </h4>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Módulo:</span>{' '}
                            <span className="font-medium">
                              {MODULE_INFO[request.module_key as ModuleKey]?.name || request.module_key}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Permissões:</span>{' '}
                            <span className="font-medium">
                              {getPermissionsText(request.permissions)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Data:</span>{' '}
                            <span>
                              {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          {request.reviewed_at && (
                            <div>
                              <span className="text-muted-foreground">Revisado em:</span>{' '}
                              <span>
                                {format(new Date(request.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground">
                            <strong>Justificativa:</strong> {request.justification}
                          </p>
                        </div>

                        {request.review_notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notas da revisão:</strong> {request.review_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewAction(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewAction('approve');
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewAction('reject');
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Revisão */}
      <Dialog open={!!selectedRequest && !!reviewAction} onOpenChange={() => {
        setSelectedRequest(null);
        setReviewAction(null);
        setReviewNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'As permissões solicitadas serão concedidas ao usuário.'
                : 'A solicitação será rejeitada e o usuário será notificado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione observações sobre sua decisão..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setReviewAction(null);
              setReviewNotes('');
            }}>
              Cancelar
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
