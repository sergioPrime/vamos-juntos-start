import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { validateDateFilter, getDateFieldInfo, DATE_FIELD_MAPPINGS } from "@/utils/dateFilterValidation"

interface DateFilterTestPanelProps {
  entries: any[]
  currentFilters: {
    dateFilterType: string
    startDate?: Date
    endDate?: Date
  }
}

export function DateFilterTestPanel({ entries, currentFilters }: DateFilterTestPanelProps) {
  const [showPanel, setShowPanel] = useState(false)

  if (!showPanel) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPanel(true)}
          className="bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200"
        >
          🔧 Debug Filtros
        </Button>
      </div>
    )
  }

  const fieldMapping = getDateFieldInfo(currentFilters.dateFilterType)
  
  const testResults = entries.slice(0, 5).map(entry => {
    const result = validateDateFilter(
      entry,
      currentFilters.dateFilterType,
      currentFilters.startDate,
      currentFilters.endDate
    )
    return { entry, result }
  })

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-orange-300 shadow-lg">
        <CardHeader className="bg-orange-50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-orange-800">
              🔧 Debug de Filtros de Data
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPanel(false)}
              className="h-6 w-6 p-0 text-orange-600"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* Current Filter Info */}
          <Alert>
            <AlertDescription className="text-xs">
              <div className="space-y-1">
                <div><strong>Filtro Ativo:</strong> {fieldMapping?.displayName || "Nenhum"}</div>
                <div><strong>Campo DB:</strong> {fieldMapping?.databaseField || "N/A"}</div>
                {currentFilters.startDate && (
                  <div><strong>Data Inicial:</strong> {format(currentFilters.startDate, 'dd/MM/yyyy')}</div>
                )}
                {currentFilters.endDate && (
                  <div><strong>Data Final:</strong> {format(currentFilters.endDate, 'dd/MM/yyyy')}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Field Mappings */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700">Mapeamento de Campos:</h4>
            {DATE_FIELD_MAPPINGS.map(mapping => (
              <div
                key={mapping.filterType}
                className={`text-xs p-2 rounded ${
                  mapping.filterType === currentFilters.dateFilterType
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-50'
                }`}
              >
                <div className="font-medium">{mapping.displayName}</div>
                <div className="text-gray-600">Campo: {mapping.databaseField}</div>
              </div>
            ))}
          </div>

          {/* Test Results */}
          {currentFilters.dateFilterType !== "none" && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">
                Teste nos Primeiros 5 Registros:
              </h4>
              {testResults.map(({ entry, result }, index) => (
                <div
                  key={entry.id}
                  className={`text-xs p-2 rounded border ${
                    result.included
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={result.included ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {result.included ? "✅ INCLUÍDO" : "❌ EXCLUÍDO"}
                    </Badge>
                    <span className="font-mono">#{index + 1}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div><strong>ID:</strong> {entry.id.slice(-8)}</div>
                    <div><strong>Valor do Campo:</strong> {result.debugInfo.rawValue || "null"}</div>
                    {result.debugInfo.dateOnly && (
                      <div><strong>Data:</strong> {result.debugInfo.dateOnly}</div>
                    )}
                    <div><strong>Motivo:</strong> {result.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <Alert>
            <AlertDescription className="text-xs">
              <div><strong>Total de Registros:</strong> {entries.length}</div>
              <div><strong>Filtro Ativo:</strong> {currentFilters.dateFilterType !== "none" ? "Sim" : "Não"}</div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}