import { useState, useMemo } from "react"
import { 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { LoadingWrapper } from "@/components/animations/LoadingWrapper"
import { useAnimation } from "@/contexts/AnimationContext"
import { cn } from "@/lib/utils"
import { ColumnConfig } from "./ColumnManager"

interface FinancialEntry {
  id: string
  entry_code?: number
  entry_type: "receivable" | "payable"
  person_type: "customer" | "supplier"
  person_id: string
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
  origin_id?: string
  document_number?: string
  // Dados relacionados
  companies?: { name: string }
  customers?: { name: string }
  suppliers?: { name: string }
  chart_of_accounts?: { account_code: string; account_name: string }
  cost_centers?: { code: string; name: string }
  payment_methods?: { name: string }
  bank_accounts?: { bank_name: string; account_number: string }
  orders?: { order_number: string }
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

  const getColumnWidth = (columnKey: string): string => {
    switch (columnKey) {
      case 'status': return '140px'
      case 'entry_code': return '90px'
      case 'company_name': return '160px'
      case 'due_date': return '130px'
      case 'entry_type': return '100px'
      case 'amount': return '130px'
      case 'settled_amount': return '130px'
      case 'balance': return '130px'
      case 'person_name': return '200px'
      case 'order_code': return '110px'
      case 'chart_of_account': return '180px'
      case 'cost_center': return '150px'
      case 'payment_method': return '160px'
      case 'description': return '220px'
      case 'bank_account': return '150px'
      case 'created_at': return '140px'
      case 'settled_at': return '140px'
      default: return '130px'
    }
  }

  const getColumnAlignment = (columnKey: string): string => {
    switch (columnKey) {
      case 'amount':
      case 'settled_amount':
      case 'balance':
        return 'text-right'
      case 'status':
        return 'text-center'
      default:
        return 'text-left'
    }
  }

  const getCellValue = (entry: FinancialEntry, columnKey: string) => {
    switch (columnKey) {
      case 'status':
        const statusInfo = getStatusInfo(entry)
        return (
          <div className="flex items-center justify-center">
            <Badge variant={statusInfo.variant} className="text-xs font-medium whitespace-nowrap">
              {statusInfo.label}
            </Badge>
          </div>
        )
      
      case 'entry_code':
        return (
          <span className="font-medium">
            {entry.entry_code || '-'}
          </span>
        )
      
      case 'company_name':
        const companyName = entry.companies?.name || '-'
        return <span className="truncate block text-foreground">{companyName}</span>
      
      case 'entry_type':
        return (
          <span>
            {entry.entry_type === 'receivable' ? 'Receita' : 'Despesa'}
          </span>
        )
      
      case 'person_name':
        let personName = '-'
        
        if (entry.person_type === 'customer' && entry.customers?.name) {
          personName = entry.customers.name
        } else if (entry.person_type === 'supplier' && entry.suppliers?.name) {
          personName = entry.suppliers.name
        }
        
        return <span className="truncate block text-foreground font-medium">{personName}</span>
      
      case 'order_code':
        const orderNumber = entry.origin_type === 'order' && entry.orders?.order_number 
          ? entry.orders.order_number 
          : '-'
        return <span className="truncate block font-medium">{orderNumber}</span>
      
      case 'bank_account':
        const bankName = entry.bank_accounts?.bank_name 
        return <span className="truncate block">{bankName || '-'}</span>
      
      case 'created_at':
        return <span>{formatDate(entry.created_at)}</span>
      
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
        return <span>{entry.settled_at ? formatDate(entry.settled_at) : '-'}</span>
      
      case 'amount':
        return (
          <span className={cn(
            "font-semibold whitespace-nowrap",
            entry.entry_type === 'receivable' ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(entry.amount)}
          </span>
        )
      
      case 'settled_amount':
        const settledAmount = entry.is_settled ? entry.amount : 0
        return (
          <span className={cn(
            "font-semibold whitespace-nowrap",
            settledAmount > 0 && entry.entry_type === 'receivable' ? "text-green-600" : 
            settledAmount > 0 && entry.entry_type === 'payable' ? "text-red-600" : ""
          )}>
            {formatCurrency(settledAmount)}
          </span>
        )
      
      case 'balance':
        const balance = entry.is_settled ? 0 : entry.amount
        return (
          <span className={cn(
            "font-semibold whitespace-nowrap",
            balance > 0 && entry.entry_type === 'receivable' ? "text-green-600" :
            balance > 0 && entry.entry_type === 'payable' ? "text-red-600" : ""
          )}>
            {formatCurrency(balance)}
          </span>
        )
      
      case 'chart_of_account':
        const accountName = entry.chart_of_accounts?.account_name
        return <span className="truncate block">{accountName || '-'}</span>
      
      case 'cost_center':
        const costCenterName = entry.cost_centers?.name
        return <span className="truncate block">{costCenterName || '-'}</span>
      
      case 'payment_method':
        const paymentMethodName = entry.payment_methods?.name
        return <span className="truncate block">{paymentMethodName || '-'}</span>
      
      case 'description':
        return (
          <span className="truncate block text-foreground" title={entry.description}>
            {entry.description || '-'}
          </span>
        )
      
      default:
        const value = entry[columnKey as keyof FinancialEntry]
        if (typeof value === 'object') return <span>-</span>
        return <span className="truncate block">{value || '-'}</span>
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
    <div className="w-full overflow-hidden border rounded-lg">
      <div className="w-full overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
          <colgroup>
            <col style={{ width: '50px' }} />
            {visibleColumns.map((column) => (
              <col key={column.key} style={{ width: getColumnWidth(column.key) }} />
            ))}
            <col style={{ width: '100px' }} />
          </colgroup>

        <thead className="bg-muted/50 sticky top-0 z-10">
          <tr className="border-b">
            {/* Checkbox Column */}
            <th className="h-12 px-4 text-center align-middle font-medium">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={selectedEntries.length === entries.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </div>
            </th>
            
            {/* Data Columns */}
            {visibleColumns.map((column) => {
              const alignment = getColumnAlignment(column.key)
              
              return (
                <th 
                  key={column.key} 
                  className={cn("h-12 px-4 align-middle font-medium text-xs", alignment)}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key as keyof FinancialEntry)}
                      className={cn(
                        "flex items-center gap-1 w-full hover:text-primary transition-colors",
                        alignment === 'text-right' && 'justify-end',
                        alignment === 'text-center' && 'justify-center',
                        alignment === 'text-left' && 'justify-start'
                      )}
                    >
                      <span className="truncate">{column.label}</span>
                      {getSortIcon(column.key)}
                    </button>
                  ) : (
                    <div className={cn(
                      "truncate",
                      alignment === 'text-center' && 'text-center',
                      alignment === 'text-right' && 'text-right'
                    )}>
                      {column.label}
                    </div>
                  )}
                </th>
              )
            })}
            
            {/* Actions Column */}
            <th className="h-12 px-4 text-center align-middle font-medium text-xs">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="bg-background">
            {sortedEntries.map((entry, index) => (
              <tr
                key={entry.id}
                className={cn(
                  "border-b transition-colors",
                  index % 2 === 0 ? "bg-background" : "bg-muted/10",
                  "hover:bg-muted/30",
                  selectedEntries.includes(entry.id) && "bg-muted/40"
                )}
              >
                {/* Checkbox Cell */}
                <td className="p-4 text-center align-middle">
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                    aria-label={`Selecionar lançamento ${entry.id}`}
                  />
                </td>
                
                 {/* Data Cells */}
                {visibleColumns.map((column) => {
                  const alignment = getColumnAlignment(column.key)
                  
                  return (
                    <td 
                      key={`${entry.id}-${column.key}`} 
                      className={cn("p-4 align-middle text-sm", alignment)}
                    >
                      {getCellValue(entry, column.key)}
                    </td>
                  )
                })}
                
                {/* Actions Cell */}
                <td className="p-4 align-middle">
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
      </table>
      </div>
    </div>
  )
}