import { useState } from 'react'
import { Search, Filter, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

export interface OverdueFilters {
  search: string
  customer: string
  dueDateFrom: Date | undefined
  dueDateTo: Date | undefined
  minAmount: string
  maxAmount: string
  status: string
  costCenter: string
}

interface OverdueReceivablesFiltersProps {
  filters: OverdueFilters
  onFiltersChange: (filters: OverdueFilters) => void
  onExport: (format: 'excel' | 'pdf' | 'csv') => void
  onPrint: () => void
}

export function OverdueReceivablesFilters({
  filters,
  onFiltersChange,
  onExport,
  onPrint
}: OverdueReceivablesFiltersProps) {
  const updateFilter = (key: keyof OverdueFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      customer: '',
      dueDateFrom: undefined,
      dueDateTo: undefined,
      minAmount: '',
      maxAmount: '',
      status: 'all',
      costCenter: 'all'
    })
  }

  return (
    <div className="space-y-4">
      {/* Busca rápida */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busca rápida (código, cliente, descrição...)"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onExport('excel')}
            className="bg-background"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('pdf')}
            className="bg-background"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            className="bg-background"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={onPrint}
            className="bg-background"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros avançados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Cliente</Label>
          <Input
            id="customer"
            placeholder="Nome ou CNPJ/CPF"
            value={filters.customer}
            onChange={(e) => updateFilter('customer', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Data de Vencimento (De)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background",
                  !filters.dueDateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dueDateFrom ? (
                  format(filters.dueDateFrom, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background" align="start">
              <Calendar
                mode="single"
                selected={filters.dueDateFrom}
                onSelect={(date) => updateFilter('dueDateFrom', date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data de Vencimento (Até)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background",
                  !filters.dueDateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dueDateTo ? (
                  format(filters.dueDateTo, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background" align="start">
              <Calendar
                mode="single"
                selected={filters.dueDateTo}
                onSelect={(date) => updateFilter('dueDateTo', date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="bg-background border">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="open">Em aberto</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="renegotiated">Renegociado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minAmount">Valor Mínimo</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="0,00"
            value={filters.minAmount}
            onChange={(e) => updateFilter('minAmount', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAmount">Valor Máximo</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder="0,00"
            value={filters.maxAmount}
            onChange={(e) => updateFilter('maxAmount', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costCenter">Centro de Custo</Label>
          <Select value={filters.costCenter} onValueChange={(value) => updateFilter('costCenter', value)}>
            <SelectTrigger className="bg-background border">
              <SelectValue placeholder="Todos os centros" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos os centros</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="administrativo">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={clearFilters} className="w-full bg-background">
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </div>
    </div>
  )
}