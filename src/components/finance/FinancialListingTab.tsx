import { useState, useEffect, useMemo } from "react"
import { RefreshCcw, Download, Filter, Plus, Search, SlidersHorizontal, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFinancialEntries } from "@/hooks/useFinancialEntries"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

import { FinancialFilters } from "./FinancialFilters"
import { FinancialSummaryHeader } from "./FinancialSummaryHeader"
import { FinancialTable } from "./FinancialTable"
import { FinancialActionsBar } from "./FinancialActionsBar"
import { ColumnManager, ColumnConfig } from "./ColumnManager"
import { LoadingWrapper } from "@/components/animations/LoadingWrapper"
import { PageTransition } from "@/components/layout/PageTransition"
import { usePersistentFilters } from "@/hooks/usePersistentFilters"
import { validateDateFilter, logDateFilterSummary } from "@/utils/dateFilterValidation"

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

// Calculate current month start and end dates
const getCurrentMonthDates = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startOfMonth, endOfMonth }
}

const { startOfMonth, endOfMonth } = getCurrentMonthDates()

const DEFAULT_FILTERS: FilterValues = {
  // Text search
  searchText: "",
  documentNumber: "",
  boletoNumber: "",
  description: "",
  
  // Dropdowns
  personId: "",
  chartOfAccountId: "all",
  paymentMethodId: "all",
  companyId: "all",
  bankAccountId: "all",
  grupo: "all",
  costCenterId: "all",
  entryType: "all",
  status: "all",
  
  // Values
  minAmount: "",
  maxAmount: "",
  
  // Dates - Default to current month filtered by due date
  periodType: "custom",
  dateFilterType: "due_date",
  startDate: startOfMonth,
  endDate: endOfMonth
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'status', label: 'Situação', visible: true, sortable: true },
  { key: 'entry_code', label: 'Código', visible: true, sortable: true },
  { key: 'company_name', label: 'Empresa', visible: true, sortable: true },
  { key: 'due_date', label: 'Vencimento', visible: true, sortable: true },
  { key: 'entry_type', label: 'Tipo', visible: true, sortable: true },
  { key: 'amount', label: 'Previsto', visible: true, sortable: true },
  { key: 'settled_amount', label: 'Realizado', visible: true, sortable: true },
  { key: 'balance', label: 'Saldo', visible: true, sortable: true },
  { key: 'person_name', label: 'Cliente/Fornecedor', visible: true, sortable: true },
  { key: 'order_code', label: 'Pedido', visible: true, sortable: true },
  { key: 'chart_of_account', label: 'Plano de Conta', visible: true, sortable: true },
  { key: 'cost_center', label: 'Centro Custo', visible: false, sortable: true },
  { key: 'payment_method', label: 'Forma Pagamento', visible: false, sortable: true },
  { key: 'description', label: 'Descrição', visible: false, sortable: false },
  { key: 'bank_account', label: 'Banco/Conta', visible: false, sortable: true },
  { key: 'created_at', label: 'Data Lançamento', visible: false, sortable: true },
  { key: 'settled_at', label: 'Data Quitação', visible: false, sortable: true }
]

export function FinancialListingTab({ onEntriesSelected }: { onEntriesSelected?: (entryIds: string[]) => void }) {
  const { entries, loading: entriesLoading, loadEntries } = useFinancialEntries()
  const organization = useOrganization()
  const { toast } = useToast()
  
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersLoading, setFiltersLoading] = useState(false)
  
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  
  const {
    filters,
    updateFilters,
    clearFilters
  } = usePersistentFilters<FilterValues>({
    key: 'financial-listing-filters',
    defaultFilters: DEFAULT_FILTERS
  })

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadSupportingData()
    }
  }, [organization])

  const loadSupportingData = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      const [
        customersResponse,
        suppliersResponse,
        chartResponse,
        costCentersResponse,
        paymentMethodsResponse,
        bankAccountsResponse,
        companiesResponse
      ] = await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .eq("org_id", organization.currentOrg.id),
        
        supabase
          .from("suppliers")
          .select("*")
          .eq("org_id", organization.currentOrg.id),
        
        supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
        
        supabase
          .from("cost_centers")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
        
        supabase
          .from("payment_methods")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("active", true),
        
        supabase
          .from("bank_accounts")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true),
          
        supabase
          .from("companies")
          .select("*")
          .eq("org_id", organization.currentOrg.id)
          .eq("is_active", true)
      ])

      setCustomers(customersResponse.data || [])
      setSuppliers(suppliersResponse.data || [])
      setChartOfAccounts(chartResponse.data || [])
      setCostCenters(costCentersResponse.data || [])
      setPaymentMethods(paymentMethodsResponse.data || [])
      setBankAccounts(bankAccountsResponse.data || [])
      setCompanies(companiesResponse.data || [])
    } catch (error) {
      console.error("Error loading supporting data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de apoio",
        variant: "destructive",
      })
    }
  }

  // Filter entries based on current filters
  const filteredEntries = useMemo(() => {
    console.log("🔍 [FILTER DEBUG] Starting filter process:", { 
      totalEntries: entries.length, 
      filters: {
        dateFilterType: filters.dateFilterType,
        startDate: filters.startDate?.toISOString().split('T')[0],
        endDate: filters.endDate?.toISOString().split('T')[0],
        periodType: filters.periodType
      }
    })
    
    const result = entries.filter(entry => {
      // === DATE FILTERING LOGIC ===
      // IMPORTANT: If no date filter is set, show ALL entries (including retroactive ones)
      if (!filters.dateFilterType || filters.dateFilterType === "none") {
        console.log("📅 [FILTER DEBUG] No date filter - showing all entries")
        // Skip date filtering entirely - show all entries
      } else {
        // Apply date filter only when explicitly set
        const dateValidation = validateDateFilter(
          entry, 
          filters.dateFilterType, 
          filters.startDate, 
          filters.endDate
        )
        
        console.log(`${dateValidation.included ? '✅' : '❌'} [FILTER DEBUG] Entry ${dateValidation.included ? 'included' : 'excluded'}:`, {
          entryId: entry.id,
          filterType: filters.dateFilterType,
          fieldName: dateValidation.debugInfo.fieldName,
          rawValue: dateValidation.debugInfo.rawValue,
          dateOnly: dateValidation.debugInfo.dateOnly,
          reason: dateValidation.reason,
          filterDates: {
            start: filters.startDate?.toISOString().split('T')[0],
            end: filters.endDate?.toISOString().split('T')[0]
          }
        })
        
        if (!dateValidation.included) {
          return false
        }
      }

      // Filter by status
      if (filters.status !== "all") {
        switch (filters.status) {
          case "settled":
            if (!entry.is_settled) return false
            break
          case "pending":
            if (entry.is_settled) return false
            break
          case "overdue":
            if (entry.is_settled || new Date(entry.due_date) >= new Date()) return false
            break
        }
      }

      // Filter by person
      if (filters.personId && entry.person_id !== filters.personId) return false

      // Filter by chart of account
      if (filters.chartOfAccountId && filters.chartOfAccountId !== "all" && entry.chart_of_account_id !== filters.chartOfAccountId) return false

      // Filter by cost center
      if (filters.costCenterId && filters.costCenterId !== "all" && entry.cost_center_id !== filters.costCenterId) return false

      // Filter by payment method
      if (filters.paymentMethodId && filters.paymentMethodId !== "all" && entry.payment_method_id !== filters.paymentMethodId) return false

      // Filter by bank account
      if (filters.bankAccountId && filters.bankAccountId !== "all" && entry.bank_account_id !== filters.bankAccountId) return false

      // Filter by entry type
      if (filters.entryType !== "all" && entry.entry_type !== filters.entryType) return false

      // Filter by amount range
      if (filters.minAmount && entry.amount < parseFloat(filters.minAmount)) return false
      if (filters.maxAmount && entry.amount > parseFloat(filters.maxAmount)) return false

      return true
    })
    
    // Log summary of date filtering
    if (filters.dateFilterType && filters.dateFilterType !== "none") {
      logDateFilterSummary(
        entries.length,
        result.length,
        filters.dateFilterType,
        filters.startDate,
        filters.endDate
      )
    }
    
    return result
  }, [entries, filters])

  const handleApplyFilters = () => {
    setFiltersLoading(true)
    setTimeout(() => {
      setFiltersLoading(false)
    }, 500)
  }

  const handleClearFilters = () => {
    clearFilters()
    setSelectedEntries([])
  }

  const handleSelectEntry = (entryId: string, isSelected: boolean) => {
    setSelectedEntries(prev => {
      const updated = isSelected 
        ? [...prev, entryId]
        : prev.filter(id => id !== entryId)
      
      // Notify parent component about selection change
      if (onEntriesSelected) {
        onEntriesSelected(updated)
      }
      
      return updated
    })
  }

  const handleEdit = (entry: any) => {
    const event = new CustomEvent('switch-to-dados-tab', { 
      detail: { entry } 
    });
    window.dispatchEvent(event);
  }

  const handleDelete = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Lançamento Excluído",
        description: "O lançamento foi excluído com sucesso",
      })
      loadEntries()
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lançamento",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada",
    })
  }

  const handleBulkDelete = async (entryIds: string[]) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .delete()
        .in('id', entryIds);

      if (error) throw error;

      toast({
        title: "Lançamentos Excluídos",
        description: `${entryIds.length} lançamento(s) excluído(s) com sucesso`,
      })
      loadEntries()
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lançamentos",
        variant: "destructive",
      })
    }
  }

  const handleBulkSettle = async (entryIds: string[]) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .update({
          is_settled: true,
          settled_at: new Date().toISOString(),
        })
        .in('id', entryIds);

      if (error) throw error;

      toast({
        title: "Lançamentos Quitados",
        description: `${entryIds.length} lançamento(s) quitado(s) com sucesso`,
      })
      loadEntries()
    } catch (error) {
      console.error('Error settling entries:', error);
      toast({
        title: "Erro",
        description: "Erro ao quitar lançamentos",
        variant: "destructive",
      })
    }
  }

  const handleGenerateBoleto = (entryIds: string[]) => {
    toast({
      title: "Gerar Boleto",
      description: "Funcionalidade de geração de boleto será implementada",
    })
  }

  const handleGenerateCarne = (entryIds: string[]) => {
    toast({
      title: "Gerar Carnê",
      description: "Funcionalidade de geração de carnê será implementada",
    })
  }

  const isLoading = entriesLoading || filtersLoading

  return (
    <PageTransition direction="left">
      <div className="space-y-6">
        {/* Header com busca e ações */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por Cód./Desc"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FinancialFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              customers={customers}
              suppliers={suppliers}
              chartOfAccounts={chartOfAccounts}
              costCenters={costCenters}
              paymentMethods={paymentMethods}
              bankAccounts={bankAccounts}
              companies={companies}
              loading={filtersLoading}
            />
            
            <Button variant="outline" className="gap-2">
              <MoreVertical className="h-4 w-4" />
              Mais Ações
            </Button>
            
            <Button 
              className="gap-2"
              onClick={() => {
                const event = new CustomEvent('switch-to-dados-tab', { 
                  detail: { entry: null } 
                });
                window.dispatchEvent(event);
              }}
            >
              <Plus className="h-4 w-4" />
              NOVO
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <LoadingWrapper loading={isLoading} type="card">
          <FinancialSummaryHeader entries={filteredEntries} />
        </LoadingWrapper>

        {/* Barra de Ações Rápidas */}
        <FinancialActionsBar
          selectedEntries={selectedEntries}
          entries={filteredEntries}
          onClearSelection={() => setSelectedEntries([])}
          onEdit={handleEdit}
          onDelete={handleBulkDelete}
          onSettle={handleBulkSettle}
          onGenerateBoleto={handleGenerateBoleto}
          onGenerateCarne={handleGenerateCarne}
        />

        {/* Table Section */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header with Actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  Lançamentos ({filteredEntries.length})
                </h3>
                {selectedEntries.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedEntries.length} selecionados
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEntries}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                
                <ColumnManager
                  columns={columns}
                  onColumnsChange={setColumns}
                />
              </div>
            </div>

            {/* Financial Table */}
            <FinancialTable
              entries={filteredEntries}
              columns={columns}
              loading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedEntries={selectedEntries}
              onSelectionChange={(ids) => {
                setSelectedEntries(ids)
                if (onEntriesSelected) {
                  onEntriesSelected(ids)
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
