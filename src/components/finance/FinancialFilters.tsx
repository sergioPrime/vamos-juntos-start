import { useState } from "react"
import { Search, X, Filter, Calendar as CalendarIconLucide } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
      
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Busca Avançada
          </DialogTitle>
          <DialogDescription>
            Utilize os filtros abaixo para refinar sua pesquisa de lançamentos financeiros
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-4">
          {/* Main Filters Column (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Primeira linha - Busca de Texto */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2">Busca por Texto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">COD, DOC, BOLETO, Descrição</Label>
                  <Input
                    placeholder="Buscar..."
                    value={filters.searchText || ""}
                    onChange={(e) => updateFilter("searchText", e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Cliente / Fornecedor</Label>
                  <ComboboxAsync
                    value={filters.personId}
                    onValueChange={(value) => updateFilter("personId", value)}
                    searchFunction={searchPessoasAll}
                    placeholder="Selecionar..."
                    emptyText="Nenhuma pessoa encontrada"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Plano de Conta</Label>
                  <ComboboxAsync
                    value={filters.chartOfAccountId === "all" ? "" : filters.chartOfAccountId}
                    onValueChange={(value) => updateFilter("chartOfAccountId", value || "all")}
                    searchFunction={asyncSearch.searchChartOfAccounts}
                    placeholder="Todas as contas"
                    emptyText="Nenhuma conta encontrada"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Forma de Pagamento</Label>
                  <ComboboxAsync
                    value={filters.paymentMethodId === "all" ? "" : filters.paymentMethodId}
                    onValueChange={(value) => updateFilter("paymentMethodId", value || "all")}
                    searchFunction={asyncSearch.searchPaymentMethods}
                    placeholder="Todas as formas"
                    emptyText="Nenhuma forma de pagamento encontrada"
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Segunda linha - Filtros de Empresa, Conta, Grupo, Centro de Custo */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Empresa</Label>
                  <ComboboxAsync
                    value={filters.companyId === "all" ? "" : filters.companyId}
                    onValueChange={(value) => updateFilter("companyId", value || "all")}
                    searchFunction={asyncSearch.searchCompanies}
                    placeholder="Todas as empresas"
                    emptyText="Nenhuma empresa encontrada"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Conta Bancária</Label>
                  <ComboboxAsync
                    value={filters.bankAccountId === "all" ? "" : filters.bankAccountId}
                    onValueChange={(value) => updateFilter("bankAccountId", value || "all")}
                    searchFunction={asyncSearch.searchBankAccounts}
                    placeholder="Todas as contas"
                    emptyText="Nenhuma conta bancária encontrada"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Grupo</Label>
                  <Select value={filters.grupo} onValueChange={(value) => updateFilter("grupo", value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="all">Todos os grupos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Centro de Custo</Label>
                  <ComboboxAsync
                    value={filters.costCenterId === "all" ? "" : filters.costCenterId}
                    onValueChange={(value) => updateFilter("costCenterId", value || "all")}
                    searchFunction={asyncSearch.searchCostCenters}
                    placeholder="Todos os centros"
                    emptyText="Nenhum centro de custo encontrado"
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Terceira linha - Valor, Tipo e Situação */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2">Valor e Classificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Valor Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter("minAmount", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Valor Máximo</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.maxAmount}
                    onChange={(e) => updateFilter("maxAmount", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Tipo de Lançamento</Label>
                  <Select value={filters.entryType} onValueChange={(value) => updateFilter("entryType", value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receivable">Receita</SelectItem>
                      <SelectItem value="payable">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Situação do Lançamento</Label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="settled">Quitada</SelectItem>
                      <SelectItem value="overdue">Vencida</SelectItem>
                      <SelectItem value="conciliated">Conciliado</SelectItem>
                      <SelectItem value="not_conciliated">Não Conciliado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filters Sidebar (1/4 width) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-primary/10 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                <CalendarIconLucide className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Filtros por Datas</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Por Período</Label>
                <Select 
                  value={filters.periodType || "thisMonth"} 
                  onValueChange={(value) => updateFilter("periodType", value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-[100]" position="popper" sideOffset={5}>
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
                    <Label className="text-sm">Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background",
                            !filters.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border z-[100]" align="start" sideOffset={5}>
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
                    <Label className="text-sm">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background",
                            !filters.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border z-[100]" align="start" sideOffset={5}>
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
                <Label className="text-sm">Filtrar Por</Label>
                <Select 
                  value={filters.dateFilterType || "due"} 
                  onValueChange={(value) => updateFilter("dateFilterType", value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Tipo de data" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-[100]" position="popper" sideOffset={5}>
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
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
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
