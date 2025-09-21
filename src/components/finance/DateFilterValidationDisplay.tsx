import { useMemo } from "react"
import { format } from "date-fns"
import { AlertCircle, CheckCircle, Calendar, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDateFieldInfo } from "@/utils/dateFilterValidation"

interface DateFilterValidationDisplayProps {
  filters: {
    dateFilterType: string
    periodType?: string
    startDate?: Date
    endDate?: Date
  }
  entriesCount?: number
  className?: string
}

export function DateFilterValidationDisplay({ 
  filters, 
  entriesCount, 
  className 
}: DateFilterValidationDisplayProps) {
  const fieldInfo = useMemo(() => 
    getDateFieldInfo(filters.dateFilterType), [filters.dateFilterType]
  )

  const hasDateFilter = filters.dateFilterType !== "none"
  const hasDateRange = filters.startDate || filters.endDate
  const isValidRange = filters.startDate && filters.endDate && filters.startDate <= filters.endDate

  // Se não há filtro de data ativo, não mostrar nada
  if (!hasDateFilter) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Status dos Filtros de Data
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Status do filtro atual */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            {hasDateRange ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <Badge variant={hasDateRange ? "default" : "secondary"}>
              {fieldInfo?.displayName || "Campo não identificado"}
            </Badge>
          </div>
        </div>

        {/* Informações do campo selecionado */}
        {fieldInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Campo do banco:</strong> {fieldInfo.databaseField}<br />
              <strong>Descrição:</strong> {fieldInfo.description}
            </AlertDescription>
          </Alert>
        )}

        {/* Intervalo de datas */}
        {hasDateRange && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Intervalo Configurado:</div>
            <div className="flex flex-wrap gap-2">
              {filters.startDate && (
                <Badge variant="outline">
                  Início: {format(filters.startDate, "dd/MM/yyyy")}
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="outline">
                  Fim: {format(filters.endDate, "dd/MM/yyyy")}
                </Badge>
              )}
            </div>
            
            {filters.startDate && filters.endDate && (
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const diffTime = Math.abs(filters.endDate.getTime() - filters.startDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  return `Período de ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Período pré-definido */}
        {filters.periodType && filters.periodType !== "custom" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Período pré-definido: <strong>{filters.periodType}</strong>
              <br />
              As datas foram calculadas automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado da filtragem */}
        {typeof entriesCount !== "undefined" && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <strong>Resultado:</strong> {entriesCount} {entriesCount === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}
            </div>
          </div>
        )}

        {/* Validações */}
        {!hasDateRange && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Nenhuma data foi selecionada. Configure o período para aplicar o filtro.
            </AlertDescription>
          </Alert>
        )}

        {filters.startDate && filters.endDate && !isValidRange && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              A data inicial não pode ser maior que a data final.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}