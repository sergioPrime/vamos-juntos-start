import { useState } from "react";
import { useAdminAuditLogs, AdminAuditLog } from "@/hooks/useAdminAuditLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditLogDetailsDialog } from "./AuditLogDetailsDialog";
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AdminAuditLogs() {
  const [actionType, setActionType] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { logs, loading, totalCount, refresh, exportToCSV } = useAdminAuditLogs({
    actionType: actionType || undefined,
    entityType: entityType || undefined,
    search: search || undefined,
    startDate,
    endDate,
  });

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

  const clearFilters = () => {
    setActionType("");
    setEntityType("");
    setSearch("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Logs de Auditoria
              <Badge variant="secondary">{totalCount} registros</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={logs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Email, ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action-type">Tipo de Ação</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger id="action-type">
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="CREATE">Criar</SelectItem>
                      <SelectItem value="UPDATE">Atualizar</SelectItem>
                      <SelectItem value="DELETE">Excluir</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity-type">Tipo de Entidade</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="Todas as entidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="subscription_plans">Planos</SelectItem>
                      <SelectItem value="organizations">Organizações</SelectItem>
                      <SelectItem value="profiles">Perfis</SelectItem>
                      <SelectItem value="system_config">Configurações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setStartDate(e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setEndDate(e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tabela */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum log encontrado
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_email || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.entity_id ? log.entity_id.substring(0, 8) + "..." : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.ip_address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <AuditLogDetailsDialog
        log={selectedLog}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
