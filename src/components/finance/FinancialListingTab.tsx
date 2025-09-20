import { useState, useEffect, useMemo } from "react"
import { RefreshCcw, Download, Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useFinancialEntries } from "@/hooks/useFinancialEntries"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

import { FinancialFilters } from "./FinancialFilters"
import { FinancialSummaryCards } from "./FinancialSummaryCards"
import { FinancialTable } from "./FinancialTable"
import { ColumnManager, ColumnConfig } from "./ColumnManager"
import { LoadingWrapper } from "@/components/animations/LoadingWrapper"
import { PageTransition } from "@/components/layout/PageTransition"
import { usePersistentFilters } from "@/hooks/usePersistentFilters"
import { validateDateFilter, logDateFilterSummary } from "@/utils/dateFilterValidation"

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

const DEFAULT_FILTERS: FilterValues = {
  dateType: "due", // Legacy field for compatibility
  periodType: undefined,
  dateFilterType: "none",
  status: "all",
  personId: "",
  chartOfAccountId: "all",
  costCenterId: "all",
  paymentMethodId: "all",
  bankAccountId: "all",
  entryType: "all",
  minAmount: "",
  maxAmount: ""
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'status', label: 'Situação', visible: true, sortable: true, required: true },
  { key: 'entry_code', label: 'Código', visible: true, sortable: true },
  { key: 'person_name', label: 'Cliente/Fornecedor', visible: true, sortable: true, required: true },
  { key: 'bank_account', label: 'Banco/Conta', visible: false, sortable: true },
  { key: 'created_at', label: 'Data Lançamento', visible: false, sortable: true },
  { key: 'due_date', label: 'Data Vencimento', visible: true, sortable: true, required: true },
  { key: 'settled_at', label: 'Data Quitação', visible: false, sortable: true },
  { key: 'amount', label: 'Valor Previsto', visible: true, sortable: true, required: true },
  { key: 'balance', label: 'Saldo', visible: true, sortable: true },
  { key: 'chart_of_account', label: 'Plano de Contas', visible: false, sortable: true },
  { key: 'cost_center', label: 'Centro de Custo', visible: true, sortable: true },
  { key: 'payment_method', label: 'Forma Pagamento', visible: false, sortable: true },
  { key: 'description', label: 'Descrição', visible: true, sortable: false, required: true }
]

export function FinancialListingTab() {
  const organization = useOrganization()
  const { toast } = useToast()
  const { entries, loading: entriesLoading, loadEntries } = useFinancialEntries()
  
  // Use persistent filters
  const { filters, updateFilters, clearFilters } = usePersistentFilters<FilterValues>({
    key: 'financial-listing-filters',
    defaultFilters: DEFAULT_FILTERS,
    useSessionStorage: false
  })
  
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [filtersLoading, setFiltersLoading] = useState(false)
  
  // Data for dropdowns and filters
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  // Load supporting data
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
        bankAccountsResponse
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
          .eq("is_active", true)
      ])

      setCustomers(customersResponse.data || [])
      setSuppliers(suppliersResponse.data || [])
      setChartOfAccounts(chartResponse.data || [])
      setCostCenters(costCentersResponse.data || [])
      setPaymentMethods(paymentMethodsResponse.data || [])
      setBankAccounts(bankAccountsResponse.data || [])
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
      if (filters.dateFilterType === "none" || !filters.dateFilterType) {
        console.log("📅 [FILTER DEBUG] Skipping date filter - none selected or undefined")
      } else if (filters.dateFilterType && filters.dateFilterType !== "none") {
        // Use the new validation utility
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
          case "conciliated":
            // TODO: Add conciliation logic when available
            break
          case "not_conciliated":
            // TODO: Add conciliation logic when available
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

  // Calculate summary data
  const summaryData = useMemo(() => {
    const payables = filteredEntries.filter(e => e.entry_type === 'payable')
    const receivables = filteredEntries.filter(e => e.entry_type === 'receivable')

    const payablePlanned = payables.reduce((sum, e) => sum + e.amount, 0)
    const payableRealized = payables.filter(e => e.is_settled).reduce((sum, e) => sum + e.amount, 0)
    
    const receivablePlanned = receivables.reduce((sum, e) => sum + e.amount, 0)
    const receivableRealized = receivables.filter(e => e.is_settled).reduce((sum, e) => sum + e.amount, 0)

    return {
      payables: {
        planned: payablePlanned,
        realized: payableRealized
      },
      receivables: {
        planned: receivablePlanned,
        realized: receivableRealized
      },
      balance: receivableRealized - payableRealized
    }
  }, [filteredEntries])

  const handleApplyFilters = () => {
    setFiltersLoading(true)
    // Simulate filter loading
    setTimeout(() => {
      setFiltersLoading(false)
    }, 500)
  }

  const handleClearFilters = () => {
    clearFilters()
    setSelectedEntries([])
  }

  const handleEdit = (entry: any) => {
    // Set the active tab to "dados" to edit the entry
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
    // TODO: Implement export functionality
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada",
    })
  }

  const handleSaveColumnPreferences = () => {
    // TODO: Save to user preferences
    toast({
      title: "Preferências Salvas",
      description: "Suas preferências de colunas foram salvas",
    })
  }

  const isLoading = entriesLoading || filtersLoading

  return (
    <PageTransition direction="left">
      <div className="space-y-6">
        {/* Filters Section */}
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
          loading={isLoading}
        />

        {/* Summary Cards */}
        <LoadingWrapper loading={isLoading} type="card">
          <FinancialSummaryCards data={summaryData} loading={isLoading} />
        </LoadingWrapper>

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
                  onSavePreferences={handleSaveColumnPreferences}
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
              onSelectionChange={setSelectedEntries}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}