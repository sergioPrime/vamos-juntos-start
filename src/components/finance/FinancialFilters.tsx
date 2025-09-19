import { useState } from "react"
import { CalendarIcon, Search, X, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { AnimatedCard } from "@/components/animations/AnimatedCard"
import { useAnimation } from "@/contexts/AnimationContext"
import { DateFiltersModal } from "./DateFiltersModal"

interface FilterValues {
  dateType: string
  periodType?: string
  dateFilterType: string
  startDate?: Date
  endDate?: Date
  status: string
  personId: string
  chartOfAccountId: string
  costCenterId: string
  paymentMethodId: string
  bankAccountId: string
  entryType: string
  minAmount: string
  maxAmount: string
}

interface FinancialFiltersProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  customers: any[]
  suppliers: any[]
  chartOfAccounts: any[]
  costCenters: any[]
  paymentMethods: any[]
  bankAccounts: any[]
  loading?: boolean
}

export function FinancialFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  customers,
  suppliers,
  chartOfAccounts,
  costCenters,
  paymentMethods,
  bankAccounts,
  loading = false
}: FinancialFiltersProps) {
  const { animationsEnabled } = useAnimation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [personSearchOpen, setPersonSearchOpen] = useState(false)
  const [personSearchValue, setPersonSearchValue] = useState("")

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onClearFilters()
    setPersonSearchValue("")
  }

  const allPersons = [
    ...customers.map(c => ({ ...c, type: 'customer' })),
    ...suppliers.map(s => ({ ...s, type: 'supplier' }))
  ]

  const filteredPersons = allPersons.filter(person =>
    person.name?.toLowerCase().includes(personSearchValue.toLowerCase())
  )

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateFilterType && filters.dateFilterType !== "none") count++
    if (filters.startDate || filters.endDate) count++
    if (filters.status !== "all") count++
    if (filters.personId) count++
    if (filters.chartOfAccountId !== "all") count++
    if (filters.costCenterId !== "all") count++
    if (filters.paymentMethodId !== "all") count++
    if (filters.bankAccountId !== "all") count++
    if (filters.entryType !== "all") count++
    if (filters.minAmount || filters.maxAmount) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <AnimatedCard className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtros Avançados</CardTitle>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
          >
            {isExpanded ? "Menos Filtros" : "Mais Filtros"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primeira linha - Filtros principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Modal de Filtros de Data */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtros de Data</Label>
            <DateFiltersModal
              filters={{
                periodType: filters.periodType,
                dateFilterType: filters.dateFilterType || "none",
                startDate: filters.startDate,
                endDate: filters.endDate
              }}
              onFiltersChange={(dateFilters) => {
                updateFilter("periodType", dateFilters.periodType)
                updateFilter("dateFilterType", dateFilters.dateFilterType)
                updateFilter("startDate", dateFilters.startDate)
                updateFilter("endDate", dateFilters.endDate)
                // Update legacy dateType for backward compatibility
                if (dateFilters.dateFilterType !== "none") {
                  updateFilter("dateType", dateFilters.dateFilterType)
                }
              }}
              onApply={onApplyFilters}
              onClear={() => {
                updateFilter("periodType", "custom")
                updateFilter("dateFilterType", "none")
                updateFilter("startDate", undefined)
                updateFilter("endDate", undefined)
                updateFilter("dateType", "due")
              }}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Situação</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="settled">Quitado</SelectItem>
                <SelectItem value="pending">Não Quitado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="conciliated">Conciliado</SelectItem>
                <SelectItem value="not_conciliated">Não Conciliado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Lançamento</Label>
            <Select value={filters.entryType} onValueChange={(value) => updateFilter("entryType", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="receivable">Receita</SelectItem>
                <SelectItem value="payable">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className={cn(
            "space-y-4 border-t pt-4",
            animationsEnabled && "animate-fade-in"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cliente/Fornecedor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cliente/Fornecedor</Label>
                <Popover open={personSearchOpen} onOpenChange={setPersonSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={personSearchOpen}
                      className="w-full justify-between bg-background"
                    >
                      {filters.personId
                        ? allPersons.find(person => person.id === filters.personId)?.name
                        : "Selecionar pessoa..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background border z-50">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar pessoa..." 
                        value={personSearchValue}
                        onValueChange={setPersonSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                        <CommandGroup>
                          {filteredPersons.map((person) => (
                            <CommandItem
                              key={person.id}
                              value={person.name}
                              onSelect={() => {
                                updateFilter("personId", person.id === filters.personId ? "" : person.id)
                                setPersonSearchOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.personId === person.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{person.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {person.type === 'customer' ? 'Cliente' : 'Fornecedor'}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Plano de Contas */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plano de Contas</Label>
                <Select value={filters.chartOfAccountId} onValueChange={(value) => updateFilter("chartOfAccountId", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {chartOfAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Centro de Custos */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Centro de Custos</Label>
                <Select value={filters.costCenterId} onValueChange={(value) => updateFilter("costCenterId", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos os centros" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todos os centros</SelectItem>
                    {costCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.code} - {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Forma de Pagamento</Label>
                <Select value={filters.paymentMethodId} onValueChange={(value) => updateFilter("paymentMethodId", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas as formas" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todas as formas</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conta Bancária */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Conta Bancária</Label>
                <Select value={filters.bankAccountId} onValueChange={(value) => updateFilter("bankAccountId", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Filtro por Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Mínimo</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Máximo</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={loading || activeFiltersCount === 0}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button
            onClick={onApplyFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </CardContent>
    </AnimatedCard>
  )
}