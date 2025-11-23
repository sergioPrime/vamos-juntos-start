import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminAuditLog } from "@/hooks/useAdminAuditLogs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Globe,
  Monitor,
  FileText,
  ArrowRight,
} from "lucide-react";

interface AuditLogDetailsDialogProps {
  log: AdminAuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) {
  if (!log) return null;

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
      case "insert":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "update":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "delete":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Log de Auditoria
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data/Hora:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Usuário:</span>
                <span className="text-sm text-muted-foreground">
                  {log.user_email || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ação:</span>
                <Badge className={getActionColor(log.action_type)}>
                  {log.action_type}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Entidade:</span>
                <span className="text-sm text-muted-foreground">
                  {log.entity_type}
                </span>
              </div>

              {log.entity_id && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">ID da Entidade:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {log.entity_id}
                  </code>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações de contexto */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Contexto</h4>

              {log.ip_address && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">IP:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {log.ip_address}
                  </code>
                </div>
              )}

              {log.user_agent && (
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">User Agent:</span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {log.user_agent}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Valores alterados */}
            {(log.old_values || log.new_values) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Alterações
                  </h4>

                  {log.old_values && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Valores Anteriores:
                      </p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.new_values && (
                    <div>
                      <p className="text-sm font-medium mb-2">Novos Valores:</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Metadados</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
