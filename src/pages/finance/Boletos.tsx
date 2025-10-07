import { useState, useEffect } from "react"
import { RefreshCcw, Download, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"
import { usePermissionGuard } from "@/hooks/usePermissionGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FinancialActionsBar } from "@/components/finance/FinancialActionsBar"
import { FinancialTable } from "@/components/finance/FinancialTable"
import { ColumnManager, ColumnConfig } from "@/components/finance/ColumnManager"
import { Card, CardContent } from "@/components/ui/card"

interface FinancialEntry {
  id: string
  org_id: string
  entry_code?: number
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  person_id: string
  amount: number
  due_date: string
  competence_date: string
  created_at: string
  created_by: string
  updated_at: string
  is_settled: boolean
  settled_at?: string
  description?: string
  person_name?: string
  company_name?: string
  chart_of_account_name?: string
  cost_center_name?: string
  payment_method_name?: string
  bank_account_name?: string
  companies?: { name: string }
  customers?: { name: string }
  suppliers?: { name: string }
  chart_of_accounts?: { account_code: string; account_name: string }
  cost_centers?: { code: string; name: string }
  payment_methods?: { name: string }
  bank_accounts?: { bank_name: string; account_number: string }
}

const defaultColumns: ColumnConfig[] = [
  { key: "entry_code", label: "Nosso Número", visible: true, sortable: true, required: true },
  { key: "amount", label: "Valor Boleto", visible: true, sortable: true },
  { key: "due_date", label: "Data Vencimento", visible: true, sortable: true },
  { key: "document_number", label: "Número do Documento", visible: true, sortable: false },
  { key: "is_settled", label: "Pago?", visible: true, sortable: true },
  { key: "person_name", label: "Sacado", visible: true, sortable: false },
  { key: "bank_account_name", label: "Conta Bancária", visible: false, sortable: false },
  { key: "competence_date", label: "Data Emissão", visible: true, sortable: true },
]

export default function Boletos() {
  usePermissionGuard('financeiro', 'read')
  const organization = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // ✅ Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadBoletos()
    }
  }, [organization])

  const loadBoletos = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      
      // ✅ Busca com paginação
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, error, count } = await supabase
        .from("financial_entries")
        .select("*", { count: 'exact' })
        .eq("org_id", organization.currentOrg.id)
        .eq("entry_type", "receivable")
        .order("due_date", { ascending: false })
        .range(from, to)

      if (error) throw error

      setEntries((data || []) as any)
      
      // Calcular total de páginas
      const total = count || 0
      setTotalPages(Math.ceil(total / pageSize))
    } catch (error) {
      console.error("Error loading boletos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar boletos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entry: FinancialEntry) => {
    // Navigate to edit entry or open edit modal
    console.log("Edit entry:", entry)
    toast({
      title: "Editar Boleto",
      description: "Funcionalidade em desenvolvimento",
    })
  }

  const handleDelete = async (entryIds: string[]) => {
    try {
      const { error } = await supabase
        .from("financial_entries")
        .delete()
        .in("id", entryIds)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `${entryIds.length} boleto(s) excluído(s)`,
      })

      setSelectedEntries([])
      loadBoletos()
    } catch (error) {
      console.error("Error deleting entries:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir boletos",
        variant: "destructive",
      })
    }
  }

  const handleSettle = async (entryIds: string[]) => {
    try {
      const { error } = await supabase
        .from("financial_entries")
        .update({
          is_settled: true,
          settled_at: new Date().toISOString(),
        })
        .in("id", entryIds)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `${entryIds.length} boleto(s) liquidado(s)`,
      })

      setSelectedEntries([])
      loadBoletos()
    } catch (error) {
      console.error("Error settling entries:", error)
      toast({
        title: "Erro",
        description: "Erro ao liquidar boletos",
        variant: "destructive",
      })
    }
  }

  const handleGenerateBoleto = (entryIds: string[]) => {
    toast({
      title: "Gerar Boleto",
      description: "Funcionalidade em desenvolvimento",
    })
  }

  const handleGenerateCarne = (entryIds: string[]) => {
    toast({
      title: "Gerar Carnê",
      description: "Funcionalidade em desenvolvimento",
    })
  }

  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      entry.entry_code?.toString().includes(searchLower) ||
      entry.description?.toLowerCase().includes(searchLower) ||
      entry.customers?.name?.toLowerCase().includes(searchLower) ||
      entry.suppliers?.name?.toLowerCase().includes(searchLower)
    )
  })

  const visibleColumns = columns.filter(col => col.visible)

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando boletos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container w-full h-full min-h-screen space-y-6 -m-3 sm:-m-4 lg:-m-6 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boletos</h1>
          <p className="text-muted-foreground">
            Gerencie os boletos gerados do sistema
          </p>
          {!loading && (
            <div className="text-sm text-muted-foreground mt-1">
              {entries.length} boleto(s) encontrado(s)
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadBoletos}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por Número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Busca Avançada
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mais Ações</span>
            </div>
            <ColumnManager
              columns={columns}
              onColumnsChange={handleColumnsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Bar - Shows when entries are selected */}
      {selectedEntries.length > 0 && (
        <FinancialActionsBar
          selectedEntries={selectedEntries}
          entries={entries as any}
          onClearSelection={() => setSelectedEntries([])}
          onEdit={handleEdit}
          onDelete={(ids) => handleDelete(ids)}
          onSettle={(ids) => handleSettle(ids)}
          onGenerateBoleto={(ids) => handleGenerateBoleto(ids)}
          onGenerateCarne={(ids) => handleGenerateCarne(ids)}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <FinancialTable
            entries={filteredEntries}
            columns={visibleColumns}
            selectedEntries={selectedEntries}
            onSelectionChange={setSelectedEntries}
            onEdit={handleEdit}
            onDelete={(entryId) => handleDelete([entryId])}
            loading={loading}
          />
          
          {/* ✅ Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
