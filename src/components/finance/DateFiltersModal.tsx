import { useState, useEffect } from "react"
import { CalendarIcon, Calendar as CalendarLucide, Filter, X, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

import { PERIOD_OPTIONS, calculateDateRange, validateDateRange } from "@/utils/dateRanges"

interface DateFiltersModalProps {
  filters: {
    periodType?: string
    dateFilterType: string
    startDate?: Date
    endDate?: Date
  }
  onFiltersChange: (filters: any) => void
  onApply: () => void
  onClear: () => void
}

const DATE_FILTER_OPTIONS = [
  { value: "none", label: "Não filtrar por data", description: "Exibe todos os lançamentos sem restrição de data" },
  { value: "due", label: "Data de Vencimento", description: "Filtra pela data em que o lançamento vence" },
  { value: "settlement", label: "Data de Quitação", description: "Filtra pela data em que o lançamento foi quitado" },
  { value: "competence", label: "Data de Competência", description: "Filtra pela data de competência contábil" },
  { value: "entry", label: "Data de Lançamento", description: "Filtra pela data em que o lançamento foi criado" }
]

export function DateFiltersModal({ 
  filters, 
  onFiltersChange, 
  onApply, 
  onClear 
}: DateFiltersModalProps) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateLocalFilter = (key: string, value: any) => {
    console.log("🔄 DateFiltersModal updating filter:", { key, value })
    const newFilters = { ...localFilters, [key]: value }
    
    // Clear date fields when "none" is selected
    if (key === "dateFilterType" && value === "none") {
      delete newFilters.startDate
      delete newFilters.endDate
      delete newFilters.periodType
      console.log("🧹 Cleared date filters - dateFilterType set to none")
    }
    
    // Set default periodType when enabling date filtering
    if (key === "dateFilterType" && value !== "none" && !newFilters.periodType) {
      newFilters.periodType = "custom"
    }
    
    setLocalFilters(newFilters)
    
    // Auto-calculate dates for predefined periods
    if (key === "periodType" && value !== "custom" && newFilters.dateFilterType !== "none") {
      const dateRange = calculateDateRange(value)
      if (dateRange) {
        newFilters.startDate = dateRange.startDate
        newFilters.endDate = dateRange.endDate
        setLocalFilters(newFilters)
        console.log("📅 Auto-calculated date range:", { period: value, dateRange })
      }
    }
    
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null)
    }
  }

  const handleApply = async () => {
    console.log("🎯 [MODAL DEBUG] DateFiltersModal applying filters:", {
      filters: localFilters,
      dateFilterType: localFilters.dateFilterType,
      periodType: localFilters.periodType,
      startDate: localFilters.startDate?.toISOString(),
      endDate: localFilters.endDate?.toISOString()
    })
    
    setLoading(true)
    
    try {
      // Validate dates if date filtering is enabled
      if (localFilters.dateFilterType !== "none") {
        const error = validateDateRange(localFilters.startDate, localFilters.endDate)
        if (error) {
          setValidationError(error)
          toast({
            title: "Erro de Validação",
            description: error,
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        
        // Ensure we have dates when a date filter type is selected
        if (!localFilters.startDate || !localFilters.endDate) {
          setValidationError("Por favor, selecione tanto a data inicial quanto a data final.")
          toast({
            title: "Erro de Validação",
            description: "Por favor, selecione tanto a data inicial quanto a data final.",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
      }
      
      console.log("✅ [MODAL DEBUG] Validation passed, calling onFiltersChange with:", localFilters)
      
      // CRITICAL: Make sure we call onFiltersChange with the complete filter object
      onFiltersChange({
        dateFilterType: localFilters.dateFilterType,
        periodType: localFilters.periodType,
        startDate: localFilters.startDate,
        endDate: localFilters.endDate
      })
      
      // Small delay to ensure state updates
      setTimeout(() => {
        console.log("🚀 [MODAL DEBUG] Calling onApply")
        onApply()
        setOpen(false)
        
        toast({
          title: "Filtros Aplicados",
          description: "Os filtros de data foram aplicados com sucesso.",
          variant: "default"
        })
      }, 100)
      
    } catch (error) {
      console.error("❌ Error applying filters:", error)
      toast({
        title: "Erro ao Aplicar Filtros",
        description: "Ocorreu um erro ao aplicar os filtros. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    const clearedFilters = {
      ...localFilters,
      dateFilterType: "none",
      startDate: undefined,
      endDate: undefined,
      periodType: undefined
    }
    
    setLocalFilters(clearedFilters)
    setValidationError(null)
    onFiltersChange(clearedFilters)
    onClear()
    
    console.log("🧹 Date filters cleared completely")
    
    toast({
      title: "Filtros de Data Limpos",
      description: "Todos os filtros de data foram removidos."
    })
  }

  const isDateFilteringEnabled = localFilters.dateFilterType !== "none"
  const isCustomPeriod = localFilters.periodType === "custom"
  const hasActiveFilters = isDateFilteringEnabled && (localFilters.startDate || localFilters.endDate)
  const selectedDateFilterOption = DATE_FILTER_OPTIONS.find(opt => opt.value === localFilters.dateFilterType)
  const selectedPeriodOption = PERIOD_OPTIONS.find(opt => opt.value === localFilters.periodType)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasActiveFilters ? "default" : "outline"} 
          className={cn(
            "flex items-center gap-2 relative",
            hasActiveFilters && "bg-primary text-primary-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros por Datas
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
              <CheckCircle className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background border">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Configuração de Filtros por Data
          </DialogTitle>
          
          {/* Status atual dos filtros */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {selectedDateFilterOption?.label}
              </Badge>
              {selectedPeriodOption && (
                <Badge variant="outline">
                  {selectedPeriodOption.label}
                </Badge>
              )}
              {localFilters.startDate && (
                <Badge variant="outline">
                  Início: {format(localFilters.startDate, "dd/MM/yyyy")}
                </Badge>
              )}
              {localFilters.endDate && (
                <Badge variant="outline">
                  Fim: {format(localFilters.endDate, "dd/MM/yyyy")}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filtrar Por */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Filtrar Por</Label>
              {selectedDateFilterOption?.description && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Info
                </Badge>
              )}
            </div>
            <Select 
              value={localFilters.dateFilterType} 
              onValueChange={(value) => updateLocalFilter("dateFilterType", value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o tipo de data" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-[60]">
                {DATE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-start">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedDateFilterOption?.description && (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                {selectedDateFilterOption.description}
              </p>
            )}
          </div>

          {/* Por Período - Only show if date filtering is enabled */}
          {isDateFilteringEnabled && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Por Período</Label>
              <Select 
                value={localFilters.periodType || "custom"} 
                onValueChange={(value) => updateLocalFilter("periodType", value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-[60] max-h-[300px]">
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.isCustom && <CalendarIcon className="h-3 w-3" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPeriodOption && !selectedPeriodOption.isCustom && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  As datas serão calculadas automaticamente baseadas no período selecionado.
                </p>
              )}
            </div>
          )}

          {/* Data Fields - Only show if date filtering is enabled */}
          {isDateFilteringEnabled && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Intervalo de Datas</Label>
                {!isCustomPeriod && (
                  <Badge variant="secondary" className="text-xs">
                    Preenchimento Automático
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Inicial */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!isCustomPeriod}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !localFilters.startDate && "text-muted-foreground",
                          !isCustomPeriod && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.startDate ? format(localFilters.startDate, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDate}
                        onSelect={(date) => updateLocalFilter("startDate", date)}
                        initialFocus
                        className="pointer-events-auto"
                        disabled={(date) => localFilters.endDate ? date > localFilters.endDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Data Final */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!isCustomPeriod}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !localFilters.endDate && "text-muted-foreground",
                          !isCustomPeriod && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.endDate ? format(localFilters.endDate, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDate}
                        onSelect={(date) => updateLocalFilter("endDate", date)}
                        initialFocus
                        className="pointer-events-auto"
                        disabled={(date) => localFilters.startDate ? date < localFilters.startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Informações sobre o intervalo */}
              {localFilters.startDate && localFilters.endDate && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  Intervalo selecionado: {format(localFilters.startDate, "dd/MM/yyyy")} até {format(localFilters.endDate, "dd/MM/yyyy")}
                  {/* Calcular e mostrar quantidade de dias */}
                  {(() => {
                    const diffTime = Math.abs(localFilters.endDate.getTime() - localFilters.startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return ` (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={loading || !hasActiveFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button
                onClick={handleApply}
                disabled={loading}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Aplicar Filtros
                  </>
                )}
              </Button>
            </div>
            
            {/* Indicador de performance */}
            <div className="text-xs text-muted-foreground text-center bg-muted/20 p-2 rounded">
              💡 Os filtros são aplicados em tempo real para melhor performance
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}