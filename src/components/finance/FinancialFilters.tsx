import { useState } from "react"
import { Search, X, Filter, Calendar as CalendarIconLucide } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ComboboxAsync } from "@/components/ui/combobox-async"
import { useAsyncSearch } from "@/hooks/useAsyncSearch"

interface FilterValues {
  // Text search fields
  searchText?: string
  documentNumber?: string
  boletoNumber?: string
  description?: string
  
  // Dropdown fields
  personId: string
  chartOfAccountId: string
  paymentMethodId: string
  companyId: string
  bankAccountId: string
  grupo: string
  costCenterId: string
  entryType: string
  status: string
  
  // Value fields
  minAmount: string
  maxAmount: string
  
  // Date fields
  periodType?: string
  dateFilterType: string
  startDate?: Date
  endDate?: Date
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
  companies: any[]
  loading?: boolean
  trigger?: React.ReactNode
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
  companies,
  loading = false,
  trigger
}: FinancialFiltersProps) {
  const [open, setOpen] = useState(false)
  const asyncSearch = useAsyncSearch()

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onClearFilters()
  }

  const handleApplyFilters = () => {
    onApplyFilters()
    setOpen(false)
  }

  const searchPessoasAll = async (query: string) => {
    const [clientes, fornecedores] = await Promise.all([
      asyncSearch.searchPessoas(query, 'cliente'),
      asyncSearch.searchPessoas(query, 'fornecedor')
    ])
    return [...clientes, ...fornecedores]
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchText) count++
    if (filters.documentNumber) count++
    if (filters.boletoNumber) count++
    if (filters.description) count++
    if (filters.dateFilterType && filters.dateFilterType !== "none") count++
    if (filters.startDate || filters.endDate) count++
    if (filters.status !== "all") count++
    if (filters.personId) count++
    if (filters.chartOfAccountId !== "all") count++
    if (filters.paymentMethodId !== "all") count++
    if (filters.companyId !== "all") count++
    if (filters.bankAccountId !== "all") count++
    if (filters.grupo !== "all") count++
    if (filters.costCenterId !== "all") count++
    if (filters.entryType !== "all") count++
    if (filters.minAmount || filters.maxAmount) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Period options
  const periodOptions = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last7days", label: "Últimos 7 dias" },
    { value: "thisMonth", label: "Este Mês" },
    { value: "lastMonth", label: "Mês Anterior" },
    { value: "thisYear", label: "Este Ano" },
    { value: "custom", label: "Personalizado" },
  ]

  // Date filter type options
  const dateFilterTypeOptions = [
    { value: "competence", label: "Data de Lançamento" },
    { value: "due", label: "Data de Vencimento" },
    { value: "settlement", label: "Data de Quitação" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Busca Avançada
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-1">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl bg-[#1a1a1a] border-gray-800">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-lg text-cyan-400">
            Busca Avançada
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4 py-6">
          {/* Main Filters - 9 columns */}
          <div className="col-span-9 space-y-4">
            {/* First Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">COD, DOC, BOLETO, Descrição</Label>
                <Input
                  placeholder=""
                  value={filters.searchText || ""}
                  onChange={(e) => updateFilter("searchText", e.target.value)}
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Cliente / Fornecedor</Label>
                <ComboboxAsync
                  value={filters.personId}
                  onValueChange={(value) => updateFilter("personId", value)}
                  searchFunction={searchPessoasAll}
                  placeholder=""
                  emptyText="Nenhuma pessoa encontrada"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Plano de Conta</Label>
                <ComboboxAsync
                  value={filters.chartOfAccountId === "all" ? "" : filters.chartOfAccountId}
                  onValueChange={(value) => updateFilter("chartOfAccountId", value || "all")}
                  searchFunction={asyncSearch.searchChartOfAccounts}
                  placeholder=""
                  emptyText="Nenhuma conta encontrada"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Forma de Pagamento</Label>
                <ComboboxAsync
                  value={filters.paymentMethodId === "all" ? "" : filters.paymentMethodId}
                  onValueChange={(value) => updateFilter("paymentMethodId", value || "all")}
                  searchFunction={asyncSearch.searchPaymentMethods}
                  placeholder=""
                  emptyText="Nenhuma forma de pagamento encontrada"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Empresa</Label>
                <ComboboxAsync
                  value={filters.companyId === "all" ? "" : filters.companyId}
                  onValueChange={(value) => updateFilter("companyId", value || "all")}
                  searchFunction={asyncSearch.searchCompanies}
                  placeholder=""
                  emptyText="Nenhuma empresa encontrada"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Conta Bancária</Label>
                <ComboboxAsync
                  value={filters.bankAccountId === "all" ? "" : filters.bankAccountId}
                  onValueChange={(value) => updateFilter("bankAccountId", value || "all")}
                  searchFunction={asyncSearch.searchBankAccounts}
                  placeholder=""
                  emptyText="Nenhuma conta bancária encontrada"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Grupo</Label>
                <Select value={filters.grupo} onValueChange={(value) => updateFilter("grupo", value)}>
                  <SelectTrigger className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white z-[100]">
                    <SelectItem value="all">Todos os grupos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Centro de Custo</Label>
                <ComboboxAsync
                  value={filters.costCenterId === "all" ? "" : filters.costCenterId}
                  onValueChange={(value) => updateFilter("costCenterId", value || "all")}
                  searchFunction={asyncSearch.searchCostCenters}
                  placeholder=""
                  emptyText="Nenhum centro de custo encontrado"
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white"
                />
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Valor</Label>
                <Input
                  type="number"
                  placeholder=""
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                  className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Tipo de Lançamento</Label>
                <Select value={filters.entryType} onValueChange={(value) => updateFilter("entryType", value)}>
                  <SelectTrigger className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white">
                    <SelectValue placeholder="Receitas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white z-[100]">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receivable">Receitas</SelectItem>
                    <SelectItem value="payable">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white font-medium">Situação do Lançamento</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger className="h-9 bg-cyan-500/30 border-cyan-600/50 text-white">
                    <SelectValue placeholder="Não Quitado" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white z-[100]">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="settled">Quitada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="conciliated">Conciliado</SelectItem>
                    <SelectItem value="not_conciliated">Não Conciliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="h-9 w-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="pt-2">
              <Button 
                type="button" 
                variant="ghost"
                onClick={clearAllFilters}
                className="h-8 px-4 text-white hover:bg-gray-800"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Date Filters Sidebar - 3 columns */}
          <div className="col-span-3">
            <div className="bg-cyan-600/40 rounded-lg p-4 space-y-4 h-full">
              <div className="flex items-center gap-2 pb-2">
                <CalendarIconLucide className="h-4 w-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Filtros por Datas</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-white font-medium">Por Período</Label>
                <Select 
                  value={filters.periodType || "thisMonth"} 
                  onValueChange={(value) => updateFilter("periodType", value)}
                >
                  <SelectTrigger className="h-9 bg-blue-700/50 border-blue-600/50 text-white">
                    <SelectValue placeholder="Este Mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white z-[100]">
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.periodType === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white font-medium">Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-start text-left font-normal bg-blue-700/50 border-blue-600/50 text-white hover:bg-blue-700/60 hover:text-white",
                            !filters.startDate && "text-gray-400"
                          )}
                        >
                          <CalendarIconLucide className="mr-2 h-3 w-3" />
                          {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "01/10/2025"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border z-[100]" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.startDate}
                          onSelect={(date) => updateFilter("startDate", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white font-medium">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-start text-left font-normal bg-blue-700/50 border-blue-600/50 text-white hover:bg-blue-700/60 hover:text-white",
                            !filters.endDate && "text-gray-400"
                          )}
                        >
                          <CalendarIconLucide className="mr-2 h-3 w-3" />
                          {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "31/10/2025"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border z-[100]" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.endDate}
                          onSelect={(date) => updateFilter("endDate", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-white font-medium">Filtrar Por</Label>
                <Select 
                  value={filters.dateFilterType || "due"} 
                  onValueChange={(value) => updateFilter("dateFilterType", value)}
                >
                  <SelectTrigger className="h-9 bg-blue-700/50 border-blue-600/50 text-white">
                    <SelectValue placeholder="Data Vencimento" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white z-[100]">
                    {dateFilterTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
