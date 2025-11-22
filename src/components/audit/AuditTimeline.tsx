import { useAuditTimeline } from '@/hooks/useAuditTimeline';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  FileText,
  User,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditTimelineProps {
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

const actionIcons = {
  INSERT: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  APPROVE: CheckCircle,
  REJECT: XCircle,
  LOGIN: User,
  LOGOUT: User,
};

const actionColors = {
  INSERT: 'text-green-500',
  UPDATE: 'text-blue-500',
  DELETE: 'text-red-500',
  APPROVE: 'text-green-500',
  REJECT: 'text-red-500',
  LOGIN: 'text-gray-500',
  LOGOUT: 'text-gray-400',
};

const actionLabels = {
  INSERT: 'Criado',
  UPDATE: 'Atualizado',
  DELETE: 'Excluído',
  APPROVE: 'Aprovado',
  REJECT: 'Rejeitado',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

const entityTypeLabels: Record<string, string> = {
  products: 'Produto',
  customers: 'Cliente',
  suppliers: 'Fornecedor',
  orders: 'Pedido',
  financial_entries: 'Lançamento Financeiro',
  stock_movements: 'Movimento de Estoque',
  users: 'Usuário',
};

export function AuditTimeline(props: AuditTimelineProps) {
  const { eventsByDate, isLoading } = useAuditTimeline(props);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const dates = Object.keys(eventsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum evento encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold">{date}</h3>
            <Badge variant="secondary">{eventsByDate[date].length} eventos</Badge>
          </div>

          <div className="relative border-l-2 border-muted pl-6 space-y-6">
            {eventsByDate[date].map((event, index) => {
              const ActionIcon = actionIcons[event.action as keyof typeof actionIcons] || FileText;
              const actionColor = actionColors[event.action as keyof typeof actionColors] || 'text-gray-500';
              const actionLabel = actionLabels[event.action as keyof typeof actionLabels] || event.action;
              const entityLabel = entityTypeLabels[event.entity_type] || event.entity_type;

              return (
                <div 
                  key={event.id}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-[29px] p-2 rounded-full bg-background border-2 ${actionColor}`}>
                    <ActionIcon className="h-4 w-4" />
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {actionLabel} {entityLabel}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.user_email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(event.timestamp), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                            {event.ip_address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.ip_address}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={actionColor}>
                          {actionLabel}
                        </Badge>
                      </div>
                    </CardHeader>

                    {event.field_name && (
                      <CardContent className="pt-0">
                        <div className="text-sm">
                          <span className="font-medium">{event.field_name}:</span>
                          {event.old_value && (
                            <span className="text-muted-foreground line-through ml-2">
                              {event.old_value}
                            </span>
                          )}
                          {event.new_value && (
                            <span className="text-primary font-medium ml-2">
                              → {event.new_value}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
