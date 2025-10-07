import { BookOpen, FileText, CheckCircle, Edit, Trash2, X, MoreHorizontal, DollarSign, Users, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/financialExport"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import type { FinancialEntry } from "@/hooks/useFinancialEntries"

interface FinancialActionsBarProps {
  selectedEntries: string[]
  entries: FinancialEntry[]
  onClearSelection: () => void
  onEdit: (entry: FinancialEntry) => void
  onDelete: (entryIds: string[]) => void
  onSettle: (entryIds: string[]) => void
  onGenerateBoleto: (entryIds: string[]) => void
  onGenerateCarne: (entryIds: string[]) => void
}

export function FinancialActionsBar({
  selectedEntries,
  entries,
  onClearSelection,
  onEdit,
  onDelete,
  onSettle,
  onGenerateBoleto,
  onGenerateCarne,
}: FinancialActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSettleDialog, setShowSettleDialog] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = {
      title: 'Lançamentos Financeiros',
      subtitle: `${selectedEntries.length} lançamento(s) selecionado(s)`,
      headers: ['Descrição', 'Tipo', 'Valor', 'Vencimento', 'Status'],
      rows: selectedEntriesData.map(entry => [
        entry.description || 'Sem descrição',
        entry.entry_type === 'receivable' ? 'A Receber' : 'A Pagar',
        Number(entry.amount),
        new Date(entry.due_date).toLocaleDateString('pt-BR'),
        entry.is_settled ? 'Liquidado' : 'Pendente'
      ])
    }

    try {
      if (format === 'csv') await exportToCSV(exportData)
      else if (format === 'excel') await exportToExcel(exportData)
      else await exportToPDF(exportData)
      
      toast({
        title: 'Sucesso',
        description: `${selectedEntries.length} lançamento(s) exportado(s) em ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar lançamentos',
        variant: 'destructive'
      })
    }
  }

  if (selectedEntries.length === 0) return null

  const selectedEntriesData = entries.filter(e => selectedEntries.includes(e.id))
  const isSingleSelection = selectedEntries.length === 1
  const hasUnsettled = selectedEntriesData.some(e => !e.is_settled)
  const allReceivables = selectedEntriesData.every(e => e.entry_type === 'receivable')

  const handleEdit = () => {
    if (isSingleSelection) {
      onEdit(selectedEntriesData[0])
    }
  }

  const handleDelete = () => {
    onDelete(selectedEntries)
    setShowDeleteDialog(false)
    onClearSelection()
  }

  const handleSettle = () => {
    onSettle(selectedEntries)
    setShowSettleDialog(false)
    onClearSelection()
  }

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Contador de selecionados */}
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
              {selectedEntries.length}
            </div>
            <span className="text-sm font-medium">
              {selectedEntries.length === 1 
                ? "lançamento selecionado" 
                : "lançamentos selecionados"}
            </span>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Carnê de Pagamentos */}
            {allReceivables && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateCarne(selectedEntries)}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Carnê</span>
              </Button>
            )}

            {/* Gerar Boleto */}
            {allReceivables && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateBoleto(selectedEntries)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Boleto</span>
              </Button>
            )}

            {/* Quitar Selecionados */}
            {hasUnsettled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettleDialog(true)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Quitar</span>
              </Button>
            )}

            {/* Editar (só single) */}
            {isSingleSelection && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}

            {/* Excluir */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>

            {/* Mais Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden md:inline">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {allReceivables && (
                  <>
                    <DropdownMenuItem className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Carnês Bancários
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Users className="h-4 w-4" />
                      Quitar em Massa por Cliente
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cancelar Seleção */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedEntries.length === 1 ? 'este lançamento' : `estes ${selectedEntries.length} lançamentos`}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settle Dialog */}
      <AlertDialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitar Lançamentos</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar {selectedEntries.length === 1 ? 'este lançamento' : `estes ${selectedEntries.length} lançamentos`} como quitado(s)?
              {selectedEntries.length === 1 
                ? ' Você poderá adicionar detalhes do pagamento posteriormente na aba Pagamentos.'
                : ' Os lançamentos serão marcados como quitados na data atual.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSettle}>
              Confirmar Quitação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
