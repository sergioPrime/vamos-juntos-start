import { useState, useMemo } from "react"
import { 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StaggeredList } from "@/components/animations/StaggeredList"
import { LoadingWrapper } from "@/components/animations/LoadingWrapper"
import { useAnimation } from "@/contexts/AnimationContext"
import { cn } from "@/lib/utils"
import { ColumnConfig } from "./ColumnManager"

interface FinancialEntry {
  id: string
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  amount: number
  due_date: string
  competence_date: string
  created_at: string
  is_settled: boolean
  settled_at?: string
  description?: string
  person_name?: string
  company_name?: string
  chart_of_account_name?: string
  cost_center_name?: string
  payment_method_name?: string
  bank_account_name?: string
  origin_type?: string
  document_number?: string
}

interface FinancialTableProps {
  entries: FinancialEntry[]
  columns: ColumnConfig[]
  loading?: boolean
  onEdit: (entry: FinancialEntry) => void
  onDelete: (entryId: string) => void
  selectedEntries: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

type SortDirection = 'asc' | 'desc' | null
type SortField = keyof FinancialEntry | null

export function FinancialTable({ 
  entries, 
  columns, 
  loading = false,
  onEdit,
  onDelete,
  selectedEntries,
  onSelectionChange
}: FinancialTableProps) {
  const { animationsEnabled } = useAnimation()
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const visibleColumns = columns.filter(col => col.visible)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy')
    } catch {
      return dateString
    }
  }

  const getStatusInfo = (entry: FinancialEntry) => {
    if (entry.is_settled) {
      return {
        icon: CheckCircle,
        label: "Quitado",
        variant: "default" as const,
        color: "text-green-600"
      }
    }
    
    const isOverdue = new Date(entry.due_date) < new Date()
    
    if (isOverdue) {
      return {
        icon: AlertCircle,
        label: "Vencido",
        variant: "destructive" as const,
        color: "text-red-600"
      }
    }
    
    return {
      icon: Clock,
      label: "Pendente",
      variant: "secondary" as const,
      color: "text-orange-600"
    }
  }

  const handleSort = (field: keyof FinancialEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
      if (sortDirection === 'desc') {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedEntries = useMemo(() => {
    if (!sortField || !sortDirection) return entries

    return [...entries].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })
  }, [entries, sortField, sortDirection])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(entries.map(entry => entry.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedEntries, entryId])
    } else {
      onSelectionChange(selectedEntries.filter(id => id !== entryId))
    }
  }

  const getColumnAlignment = (columnKey: string): string => {
    switch (columnKey) {
      case 'amount':
      case 'balance':
        return 'text-right'
      case 'status':
        return 'text-center'
      default:
        return 'text-left'
    }
  }

  const getCellValue = (entry: FinancialEntry, columnKey: string) => {
    const alignment = getColumnAlignment(columnKey)
    
    switch (columnKey) {
      case 'status':
        const statusInfo = getStatusInfo(entry)
        const StatusIcon = statusInfo.icon
        return (
          <div className="flex items-center justify-center gap-1.5">
            <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
            <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0.5">
              {statusInfo.label}
            </Badge>
          </div>
        )
      
      case 'entry_code':
        return (
          <div className="font-mono text-xs">
            #{entry.id.slice(-8).toUpperCase()}
          </div>
        )
      
      case 'person_name':
        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs">{entry.person_name || entry.company_name || '-'}</span>
            <span className="text-[10px] text-muted-foreground">
              {entry.person_type === 'customer' ? 'Cliente' : 'Fornecedor'}
            </span>
          </div>
        )
      
      case 'bank_account':
        return entry.bank_account_name || '-'
      
      case 'created_at':
        return formatDate(entry.created_at)
      
      case 'due_date':
        const isOverdue = new Date(entry.due_date) < new Date() && !entry.is_settled
        return (
          <span className={cn(
            "font-medium",
            isOverdue && "text-red-600"
          )}>
            {formatDate(entry.due_date)}
          </span>
        )
      
      case 'settled_at':
        return entry.settled_at ? formatDate(entry.settled_at) : '-'
      
      case 'amount':
        return (
          <div className="text-right">
            <span className={cn(
              "font-semibold",
              entry.entry_type === 'receivable' ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(entry.amount)}
            </span>
          </div>
        )
      
      case 'balance':
        const balance = entry.is_settled ? 0 : entry.amount
        return (
          <div className="text-right">
            <span className={cn(
              "font-medium",
              balance > 0 && "text-orange-600"
            )}>
              {formatCurrency(balance)}
            </span>
          </div>
        )
      
      case 'chart_of_account':
        return entry.chart_of_account_name || '-'
      
      case 'cost_center':
        return entry.cost_center_name || '-'
      
      case 'payment_method':
        return entry.payment_method_name || '-'
      
      case 'description':
        return (
          <div className="max-w-xs">
            <p className="truncate" title={entry.description}>
              {entry.description || '-'}
            </p>
          </div>
        )
      
      default:
        return entry[columnKey as keyof FinancialEntry] || '-'
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortField !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-3 w-3 text-primary" />
    }
    
    if (sortDirection === 'desc') {
      return <ChevronDown className="h-3 w-3 text-primary" />
    }
    
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
  }

  if (loading) {
    return (
      <LoadingWrapper loading={true} type="table">
        <div />
      </LoadingWrapper>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">
          Nenhum lançamento encontrado
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ajuste os filtros ou adicione novos lançamentos
        </p>
      </div>
    )
  }

  return (
    <ResponsiveTable>
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-12" />
            {visibleColumns.map((column) => (
              <col key={column.key} className={cn(
                column.key === 'status' && "w-32",
                column.key === 'entry_code' && "w-28",
                column.key === 'person_name' && "w-48",
                (column.key === 'amount' || column.key === 'balance') && "w-36",
                (column.key === 'due_date' || column.key === 'created_at' || column.key === 'settled_at') && "w-32",
                column.key === 'description' && "w-64",
                !['status', 'entry_code', 'person_name', 'amount', 'balance', 'due_date', 'created_at', 'settled_at', 'description'].includes(column.key) && "w-36"
              )} />
            ))}
            <col className="w-24" />
          </colgroup>
          <TableHeader>
            <TableRow className="border-b h-12">
              <TableHead className="px-3 text-xs font-semibold text-center">
                <Checkbox
                  checked={selectedEntries.length === entries.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              
              {visibleColumns.map((column) => {
                const alignment = getColumnAlignment(column.key)
                
                return (
                  <TableHead 
                    key={column.key} 
                    className={cn(
                      "font-semibold px-3 text-xs",
                      alignment
                    )}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-auto p-0 font-semibold hover:bg-transparent -ml-3 pl-3 text-xs w-full",
                          alignment === 'text-right' ? 'justify-end' : 
                          alignment === 'text-center' ? 'justify-center' : 'justify-start'
                        )}
                        onClick={() => handleSort(column.key as keyof FinancialEntry)}
                      >
                        <span className="mr-1">{column.label}</span>
                        {getSortIcon(column.key)}
                      </Button>
                    ) : (
                      <div className={cn("w-full", alignment)}>
                        <span>{column.label}</span>
                      </div>
                    )}
                  </TableHead>
                )
              })}
              
              <TableHead className="text-center px-3 text-xs font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
        
        <TableBody>
          <StaggeredList delay={50}>
            {sortedEntries.map((entry, index) => (
              <TableRow
                key={entry.id}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50 h-10",
                  selectedEntries.includes(entry.id) && "bg-muted/30",
                  animationsEnabled && "hover:scale-[1.01] transition-transform duration-150"
                )}
              >
                <TableCell className="px-3 py-3 text-xs text-center">
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                    aria-label={`Selecionar lançamento ${entry.id}`}
                  />
                </TableCell>
                
                {visibleColumns.map((column) => {
                  const alignment = getColumnAlignment(column.key)
                  
                  return (
                    <TableCell 
                      key={`${entry.id}-${column.key}`} 
                      className={cn(
                        "align-middle px-3 py-3 text-xs",
                        alignment
                      )}
                    >
                      {getCellValue(entry, column.key)}
                    </TableCell>
                  )
                })}
                
                <TableCell className="text-center px-3 py-3 text-xs">
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(entry)}
                            className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar lançamento</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Excluir lançamento</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este lançamento? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(entry.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </StaggeredList>
        </TableBody>
      </Table>
      </div>
    </ResponsiveTable>
  )
}