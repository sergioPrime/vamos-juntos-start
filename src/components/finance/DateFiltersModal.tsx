import { useState, useEffect } from "react"
import { CalendarIcon, Calendar as CalendarLucide } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  { value: "none", label: "Não filtrar por data" },
  { value: "due", label: "Data de Vencimento" },
  { value: "settlement", label: "Data de Quitação" },
  { value: "competence", label: "Data de Competência" },
  { value: "entry", label: "Data de Lançamento" }
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

  const handleApply = () => {
    console.log("🎯 DateFiltersModal applying filters:", localFilters)
    
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
        return
      }
    }
    
    onFiltersChange(localFilters)
    onApply()
    setOpen(false)
    
    toast({
      title: "Filtros Aplicados",
      description: "Os filtros de data foram aplicados com sucesso."
    })
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CalendarLucide className="h-4 w-4" />
          Filtros por Datas
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-background border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarLucide className="h-5 w-5 text-primary" />
            Filtros de Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filtrar Por */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtrar Por</Label>
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
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Por Período - Only show if date filtering is enabled */}
          {isDateFilteringEnabled && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Por Período</Label>
              <Select 
                value={localFilters.periodType || "custom"} 
                onValueChange={(value) => updateLocalFilter("periodType", value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-[60]">
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Fields - Only show if date filtering is enabled and custom period */}
          {isDateFilteringEnabled && (
            <div className="grid grid-cols-2 gap-4">
              {/* Data Inicial */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isCustomPeriod}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !localFilters.startDate && "text-muted-foreground",
                        !isCustomPeriod && "opacity-50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.startDate ? format(localFilters.startDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date) => updateLocalFilter("startDate", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Final */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isCustomPeriod}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !localFilters.endDate && "text-muted-foreground",
                        !isCustomPeriod && "opacity-50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.endDate ? format(localFilters.endDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date) => updateLocalFilter("endDate", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleApply}
              className="flex items-center gap-2"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}