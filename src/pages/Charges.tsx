import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { useOverdueReceivables } from '@/hooks/useOverdueReceivables'
import { OverdueReceivablesSummary } from '@/components/charges/OverdueReceivablesSummary'
import { OverdueReceivablesFilters, OverdueFilters } from '@/components/charges/OverdueReceivablesFilters'
import { OverdueReceivablesTable } from '@/components/charges/OverdueReceivablesTable'
import { PageTransition } from '@/components/layout/PageTransition'
import { useToast } from '@/hooks/use-toast'

export default function Charges() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { receivables, summary, loading, settleReceivable } = useOverdueReceivables()
  
  const [filters, setFilters] = useState<OverdueFilters>({
    search: '',
    customer: '',
    dueDateFrom: undefined,
    dueDateTo: undefined,
    minAmount: '',
    maxAmount: '',
    status: 'all',
    costCenter: 'all'
  })

  // Filtrar dados baseado nos filtros aplicados
  const filteredReceivables = useMemo(() => {
    return receivables.filter(receivable => {
      // Busca rápida
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = 
          receivable.entry_code.toString().includes(searchTerm) ||
          receivable.customer_name.toLowerCase().includes(searchTerm) ||
          receivable.description.toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro por cliente
      if (filters.customer) {
        const customerTerm = filters.customer.toLowerCase()
        if (!receivable.customer_name.toLowerCase().includes(customerTerm)) {
          return false
        }
      }

      // Filtro por período de vencimento
      if (filters.dueDateFrom) {
        const dueDate = new Date(receivable.due_date)
        if (dueDate < filters.dueDateFrom) return false
      }
      if (filters.dueDateTo) {
        const dueDate = new Date(receivable.due_date)
        if (dueDate > filters.dueDateTo) return false
      }

      // Filtro por valor
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount)
        if (receivable.open_amount < minAmount) return false
      }
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount)
        if (receivable.open_amount > maxAmount) return false
      }

      // Filtro por status (ignorar 'all')
      if (filters.status && filters.status !== 'all') {
        // Implementar lógica de status quando necessário
      }

      // Filtro por centro de custo (ignorar 'all')
      if (filters.costCenter && filters.costCenter !== 'all') {
        // Implementar lógica de centro de custo quando necessário
      }

      return true
    })
  }, [receivables, filters])

  const handleSettle = async (id: string) => {
    await settleReceivable(id)
  }

  const handleEdit = (id: string) => {
    navigate(`/finance/lancamentos?id=${id}&tab=edicao`)
  }

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    toast({
      title: "Exportação",
      description: `Exportando dados em formato ${format.toUpperCase()}...`,
      variant: "default"
    })
    // Implementar exportação
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <PageTransition direction="left">
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas a Receber Vencidas</h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe as cobranças de documentos em atraso
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/finance/lancamentos?tab=criacao&type=receivable')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Receber
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <OverdueReceivablesSummary summary={summary} loading={loading} />

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Exportação</CardTitle>
          </CardHeader>
          <CardContent>
            <OverdueReceivablesFilters
              filters={filters}
              onFiltersChange={setFilters}
              onExport={handleExport}
              onPrint={handlePrint}
            />
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>
              Documentos Vencidos ({filteredReceivables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OverdueReceivablesTable
              receivables={filteredReceivables}
              loading={loading}
              onSettle={handleSettle}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>

        {/* Rodapé com totais */}
        {filteredReceivables.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Documentos exibidos:</span> {filteredReceivables.length}
                  </p>
                  <p>
                    <span className="font-medium">Total em aberto:</span>{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      filteredReceivables.reduce((sum, item) => sum + item.open_amount, 0)
                    )}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-muted-foreground">
                    Última atualização: {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}